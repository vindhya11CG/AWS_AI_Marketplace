<#
    deploy.ps1
    ----------
    One-command deployment for the AI Marketplace SharePoint -> S3 Connector & Backend Endpoints.

    Runs:
      Step 1: Package Lambda function, create/update IAM execution role and S3 policies.
      Step 2: Deploy/update the Lambda function with environment variables.
      Step 3: Wire S3 ObjectCreated notifications on the raw/ prefix.
      Step 4: Enable Lambda Function URL (or API Gateway) with public CORS for the frontend.

    Usage:
      cd connector
      ./deploy.ps1
#>

[CmdletBinding()]
param(
    [string]$Bucket       = "ai-marketplace-624807913752-us-east-1-an",
    [string]$Region       = "us-east-1",
    [string]$FunctionName = "ai-marketplace-transform",
    [string]$RoleName     = "ai-marketplace-transform-role",
    [string]$RawPrefix    = "raw/",
    [string]$ResourceTag  = "aep_aws"
)

$ErrorActionPreference = "Continue"

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " Deploying AWS AI Marketplace SharePoint-to-S3 Connector" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# Resolve AWS account ID
Write-Host "`n[1/4] Resolving AWS account identity..." -ForegroundColor Yellow
$AccountId = (aws sts get-caller-identity --query Account --output text 2>$null)
if (-not $AccountId) {
    Write-Warning "Could not resolve AWS account via 'aws sts get-caller-identity'."
    Write-Warning "Ensure AWS CLI is configured with valid credentials (aws configure)."
    $AccountId = "624807913752"
}
Write-Host "  Account: $AccountId" -ForegroundColor Green
Write-Host "  Region:  $Region" -ForegroundColor Green
Write-Host "  Bucket:  $Bucket" -ForegroundColor Green

$RoleArn     = "arn:aws:iam::${AccountId}:role/${RoleName}"
$FunctionArn = "arn:aws:lambda:${Region}:${AccountId}:function:${FunctionName}"
$BucketArn   = "arn:aws:s3:::${Bucket}"

# Step 1: Package the Lambda code
Write-Host "`n[2/4] Packaging Lambda deployment artifact..." -ForegroundColor Yellow
Compress-Archive -Path "lambda_function.py" -DestinationPath "function.zip" -Force
Write-Host "  Zipped lambda_function.py -> function.zip" -ForegroundColor Green

# Check or create IAM Role
Write-Host "`nChecking IAM Role: $RoleName..." -ForegroundColor Yellow
$existingRole = aws iam list-roles --query "Roles[?RoleName=='$RoleName'].RoleName" --output text 2>$null

if ([string]::IsNullOrWhiteSpace($existingRole)) {
    Write-Host "  Creating IAM execution role $RoleName..." -ForegroundColor Cyan
    aws iam create-role `
        --role-name $RoleName `
        --assume-role-policy-document file://trust-policy.json `
        --tags Key=team,Value=$ResourceTag | Out-Null

    Write-Host "  Attaching AWSLambdaBasicExecutionRole (CloudWatch logs)..."
    aws iam attach-role-policy `
        --role-name $RoleName `
        --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" | Out-Null

    Write-Host "  Waiting 15s for IAM role propagation..."
    Start-Sleep -Seconds 15
} else {
    Write-Host "  Role $RoleName exists - reusing." -ForegroundColor Green
}

Write-Host "  Applying S3 read/write inline policy..."
aws iam put-role-policy `
    --role-name $RoleName `
    --policy-name "ai-marketplace-s3-access" `
    --policy-document file://iam-s3-policy.json | Out-Null

# Step 2: Create or Update Lambda function
Write-Host "`n[3/4] Deploying Lambda function: $FunctionName..." -ForegroundColor Yellow
$existingFn = aws lambda list-functions --region $Region --query "Functions[?FunctionName=='$FunctionName'].FunctionName" --output text 2>$null

$envVars = "Variables={CURATED_BUCKET=$Bucket,CURATED_KEY_STARTER_PACKS=curated/starter-packs.json,CURATED_KEY_AGENTS=curated/agents.json,CURATED_KEY_CATALOG=curated/marketplace-catalog.json,RAW_PREFIX=$RawPrefix,RESOURCE_TAG=$ResourceTag}"

if ([string]::IsNullOrWhiteSpace($existingFn)) {
    Write-Host "  Creating new Lambda function..." -ForegroundColor Cyan
    aws lambda create-function `
        --function-name $FunctionName `
        --runtime "python3.12" `
        --handler "lambda_function.lambda_handler" `
        --role $RoleArn `
        --zip-file "fileb://function.zip" `
        --timeout 60 `
        --memory-size 256 `
        --environment $envVars `
        --tags team=$ResourceTag `
        --region $Region | Out-Null
} else {
    Write-Host "  Updating Lambda code and configuration..." -ForegroundColor Cyan
    aws lambda update-function-code `
        --function-name $FunctionName `
        --zip-file "fileb://function.zip" `
        --region $Region | Out-Null
    Start-Sleep -Seconds 3
    aws lambda update-function-configuration `
        --function-name $FunctionName `
        --environment $envVars `
        --timeout 60 `
        --memory-size 256 `
        --region $Region | Out-Null
}

# Step 3: Wire S3 ObjectCreated trigger on raw/
Write-Host "`n[4/4] Configuring S3 notifications & HTTP Function URL..." -ForegroundColor Yellow
Write-Host "  Granting S3 invocation permission..."
aws lambda add-permission `
    --function-name $FunctionName `
    --principal "s3.amazonaws.com" `
    --statement-id "s3invoke" `
    --action "lambda:InvokeFunction" `
    --source-arn $BucketArn `
    --source-account $AccountId `
    --region $Region 2>$null | Out-Null

# S3 notification config
$notification = @"
{
  "LambdaFunctionConfigurations": [
    {
      "LambdaFunctionArn": "$FunctionArn",
      "Events": ["s3:ObjectCreated:*"],
      "Filter": {
        "Key": {
          "FilterRules": [
            { "Name": "prefix", "Value": "$RawPrefix" }
          ]
        }
      }
    }
  ]
}
"@
$notificationFile = "s3-notification.json"
$notification | Out-File -FilePath $notificationFile -Encoding ascii
aws s3api put-bucket-notification-configuration `
    --bucket $Bucket `
    --notification-configuration file://$notificationFile 2>$null
Remove-Item $notificationFile -ErrorAction SilentlyContinue

# Step 4: Configure S3 Bucket Policy (Curated Public Read) & S3 CORS
Write-Host "`n[4/5] Applying S3 Bucket Policy & CORS Configuration..." -ForegroundColor Yellow
Write-Host "  Applying S3 CORS policy on bucket $Bucket..."
aws s3api put-bucket-cors `
    --bucket $Bucket `
    --cors-configuration file://s3-cors-policy.json 2>$null

Write-Host "  Applying S3 Public Read Bucket Policy for curated/ prefix..."
aws s3api put-bucket-policy `
    --bucket $Bucket `
    --policy file://s3-bucket-policy.json 2>$null

# Step 5: Configure Lambda Function URL with public CORS
Write-Host "`n[5/5] Configuring Lambda Function URL & Public Invocation Permissions..." -ForegroundColor Yellow
Write-Host "  Configuring Lambda Function URL for HTTP REST endpoints..."
$urlConfig = aws lambda create-function-url-config `
    --function-name $FunctionName `
    --auth-type NONE `
    --cors '{\"AllowOrigins\":[\"*\"],\"AllowMethods\":[\"*\"],\"AllowHeaders\":[\"*\"]}' `
    --region $Region 2>$null

if (-not $urlConfig) {
    # Check existing URL
    $fnUrl = aws lambda get-function-url-config --function-name $FunctionName --region $Region --query "FunctionUrl" --output text 2>$null
} else {
    $fnUrl = ($urlConfig | ConvertFrom-Json).FunctionUrl
}

# Add public invoke permission for function URL
aws lambda add-permission `
    --function-name $FunctionName `
    --statement-id "FunctionURLAllowPublicAccess" `
    --action "lambda:InvokeFunctionUrl" `
    --principal "*" `
    --function-url-auth-type "NONE" `
    --region $Region 2>$null | Out-Null

Write-Host "`n=========================================================" -ForegroundColor Green
Write-Host " Deployment Complete!" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
Write-Host "Live REST Endpoints available at Function URL:" -ForegroundColor Cyan
Write-Host "  Endpoint URL: $fnUrl"
Write-Host "  - GET  ${fnUrl}catalog"
Write-Host "  - GET  ${fnUrl}starter-packs"
Write-Host "  - GET  ${fnUrl}agents"
Write-Host "  - POST ${fnUrl}transform   (Ingests SharePoint exports)"
Write-Host "  - POST ${fnUrl}items/{id}/comments"
Write-Host "  - POST ${fnUrl}items/{id}/ratings"
Write-Host "`nCurated S3 Targets:"
Write-Host "  s3://$Bucket/curated/starter-packs.json"
Write-Host "  s3://$Bucket/curated/agents.json"
Write-Host "  s3://$Bucket/curated/marketplace-catalog.json"

<#
    deploy.ps1
    ----------
    One-command deploy for the AI Marketplace SharePoint -> S3 transform Lambda.

    Runs, in order:
      Step 1: Package the Lambda, create/reuse its IAM role, attach policies,
              and create/update the Lambda function.
      Step 2: Grant S3 permission to invoke the Lambda and wire the S3
              ObjectCreated trigger on the raw/ prefix.

    Prerequisites:
      - AWS CLI v2 installed and configured (aws configure) with rights to
        create IAM roles, Lambda functions, and set S3 notifications.
      - Run from the 'connector' folder (where lambda_function.py lives).

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
    [string]$CuratedKey   = "curated/starter-packs.json",
    [string]$ResourceTag  = "aep_aws"
)

$ErrorActionPreference = "Continue"

# Resolve the AWS account ID from the current credentials.
Write-Host "Resolving AWS account..." -ForegroundColor Cyan
$AccountId = (aws sts get-caller-identity --query Account --output text).Trim()
if (-not $AccountId) { throw "Could not resolve AWS account. Run 'aws configure' first." }
Write-Host "  Account: $AccountId"

$RoleArn     = "arn:aws:iam::${AccountId}:role/${RoleName}"
$FunctionArn = "arn:aws:lambda:${Region}:${AccountId}:function:${FunctionName}"
$BucketArn   = "arn:aws:s3:::${Bucket}"

# ---------------------------------------------------------------------------
# Step 1: Package + IAM role + Lambda
# ---------------------------------------------------------------------------
Write-Host "`n=== Step 1: Package and deploy the Lambda ===" -ForegroundColor Green

Write-Host "Zipping lambda_function.py..."
Compress-Archive -Path "lambda_function.py" -DestinationPath "function.zip" -Force

# Create the execution role if it does not already exist.
Write-Host "Checking IAM role $RoleName..."
$existingRole = aws iam list-roles --query "Roles[?RoleName=='$RoleName'].RoleName" --output text
$roleExists = -not [string]::IsNullOrWhiteSpace($existingRole)

if (-not $roleExists) {
    Write-Host "Creating IAM role $RoleName..."
    aws iam create-role `
        --role-name $RoleName `
        --assume-role-policy-document file://trust-policy.json `
        --tags Key=team,Value=$ResourceTag | Out-Null

    Write-Host "Attaching AWSLambdaBasicExecutionRole (CloudWatch logs)..."
    aws iam attach-role-policy `
        --role-name $RoleName `
        --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" | Out-Null

    Write-Host "Waiting 15s for IAM role propagation..."
    Start-Sleep -Seconds 15
} else {
    Write-Host "IAM role $RoleName already exists - reusing."
}

# (Re)apply the inline S3 read/write policy each run so it stays in sync.
Write-Host "Applying inline S3 policy (read raw/, write curated/)..."
aws iam put-role-policy `
    --role-name $RoleName `
    --policy-name "ai-marketplace-s3-access" `
    --policy-document file://iam-s3-policy.json | Out-Null

# Create the function if missing, otherwise update code + config.
Write-Host "Checking Lambda function $FunctionName..."
$existingFn = aws lambda list-functions --region $Region --query "Functions[?FunctionName=='$FunctionName'].FunctionName" --output text
$fnExists = -not [string]::IsNullOrWhiteSpace($existingFn)

$envVars = "Variables={CURATED_BUCKET=$Bucket,CURATED_KEY=$CuratedKey,RAW_PREFIX=$RawPrefix,RESOURCE_TAG=$ResourceTag}"

if (-not $fnExists) {
    Write-Host "Creating Lambda function $FunctionName..."
    $maxAttempts = 3
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
        $null = aws lambda create-function `
            --function-name $FunctionName `
            --runtime "python3.12" `
            --handler "lambda_function.lambda_handler" `
            --role $RoleArn `
            --zip-file "fileb://function.zip" `
            --timeout 60 `
            --memory-size 256 `
            --environment $envVars `
            --tags team=$ResourceTag `
            --region $Region 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Lambda function $FunctionName created successfully."
            break
        } elseif ($attempt -lt $maxAttempts) {
            Write-Host "Role still propagating, retrying in 10s (attempt $attempt of $maxAttempts)..."
            Start-Sleep -Seconds 10
        } else {
            Write-Error "Failed to create Lambda function."
        }
    }
} else {
    Write-Host "Lambda exists - updating code and configuration..."
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

Write-Host "Step 1 complete." -ForegroundColor Green

# ---------------------------------------------------------------------------
# Step 2: S3 invoke permission + trigger on raw/ prefix
# ---------------------------------------------------------------------------
Write-Host "`n=== Step 2: Wire the S3 trigger (raw/ prefix) ===" -ForegroundColor Green

# Grant S3 permission to invoke the Lambda (ignore error if already present).
Write-Host "Granting S3 permission to invoke the Lambda..."
aws lambda add-permission `
    --function-name $FunctionName `
    --principal "s3.amazonaws.com" `
    --statement-id "s3invoke" `
    --action "lambda:InvokeFunction" `
    --source-arn $BucketArn `
    --source-account $AccountId `
    --region $Region 2>&1 | Out-Null

# Configure the bucket to notify the Lambda for new objects under raw/.
Write-Host "Configuring S3 ObjectCreated notification on '$RawPrefix'..."
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
    --notification-configuration file://$notificationFile

Remove-Item $notificationFile -ErrorAction SilentlyContinue

Write-Host "Step 2 complete." -ForegroundColor Green

# ---------------------------------------------------------------------------
Write-Host "`nDeployment finished." -ForegroundColor Cyan
Write-Host "Test it by dropping a raw export into the bucket:"
Write-Host "  aws s3 cp .\your-export.json s3://$Bucket/${RawPrefix}list.json"
Write-Host "Then read the generated catalog:"
Write-Host "  aws s3 cp s3://$Bucket/$CuratedKey .\out.json"

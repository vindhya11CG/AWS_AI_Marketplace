$ErrorActionPreference = 'Continue'

Write-Host 'Starting smoke tests...' -ForegroundColor Cyan

$FNURL = (aws lambda get-function-url-config --function-name ai-marketplace-transform --region us-east-1 --query FunctionUrl --output text).TrimEnd('/')
Write-Host 'Function URL:' $FNURL
$CF_DOMAIN = 'd3qsvpfyyr6uc4.cloudfront.net'
Write-Host 'CloudFront domain:' $CF_DOMAIN

# GET /catalog
Write-Host '--- GET /catalog ---'
try {
  $res = Invoke-RestMethod "$FNURL/catalog" -Method GET
  $res | ConvertTo-Json -Depth 6 | Out-File '..\..\smoke-catalog.json' -Encoding utf8
  Write-Host 'CATALOG_OK: saved smoke-catalog.json'
} catch {
  Write-Host 'ERROR-CATALOG:' $_.Exception.Message
}

# GET /starter-packs
Write-Host '--- GET /starter-packs ---'
try {
  $res = Invoke-RestMethod "$FNURL/starter-packs" -Method GET
  $res | ConvertTo-Json -Depth 6 | Out-File '..\..\smoke-starter-packs.json' -Encoding utf8
  Write-Host 'STARTER_PACKS_OK: saved smoke-starter-packs.json'
} catch {
  Write-Host 'ERROR-STARTER-PACKS:' $_.Exception.Message
}

# GET /agents
Write-Host '--- GET /agents ---'
try {
  $res = Invoke-RestMethod "$FNURL/agents" -Method GET
  $res | ConvertTo-Json -Depth 6 | Out-File '..\..\smoke-agents.json' -Encoding utf8
  Write-Host 'AGENTS_OK: saved smoke-agents.json'
} catch {
  Write-Host 'ERROR-AGENTS:' $_.Exception.Message
}

# Fetch CloudFront curated JSON
Write-Host '--- Fetch CloudFront curated JSON ---'
try {
  Invoke-WebRequest "https://$CF_DOMAIN/curated/starter-packs.json" -UseBasicParsing -OutFile '..\..\cf-starter-packs.json'
  Write-Host 'CF_FETCH_OK: wrote cf-starter-packs.json'
} catch {
  Write-Host 'ERROR-CF-FETCH:' $_.Exception.Message
}

# POST /transform with sample test-export.json
Write-Host '--- POST /transform (test-export.json) ---'
try {
  $body = Get-Content -Raw '..\test-export.json'
  $res = Invoke-RestMethod "$FNURL/transform" -Method POST -ContentType 'application/json' -Body $body
  $res | ConvertTo-Json -Depth 6 | Out-File '..\..\smoke-transform-response.json' -Encoding utf8
  Write-Host 'TRANSFORM_OK: saved smoke-transform-response.json'
} catch {
  Write-Host 'ERROR-TRANSFORM:' $_.Exception.Message
}

Start-Sleep -Seconds 5

# Re-fetch CloudFront curated JSON after transform
Write-Host '--- Re-fetch CloudFront curated JSON after transform ---'
try {
  Invoke-WebRequest "https://$CF_DOMAIN/curated/starter-packs.json" -UseBasicParsing -OutFile '..\..\cf-starter-packs-after.json'
  Write-Host 'CF_FETCH_OK: wrote cf-starter-packs-after.json'
} catch {
  Write-Host 'ERROR-CF-FETCH-AFTER:' $_.Exception.Message
}

# S3 head-object
Write-Host '--- S3 head-object ---'
try {
  aws s3api head-object --bucket ai-marketplace-624807913752-us-east-1-an --key curated/starter-packs.json --output json | Out-File '..\..\s3-head-object.json' -Encoding utf8
  Write-Host 'HEAD_OBJECT_OK: saved s3-head-object.json'
} catch {
  Write-Host 'ERROR-HEAD-OBJECT:' $_.Exception.Message
}

Write-Host 'Smoke tests complete.' -ForegroundColor Green

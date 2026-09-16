Overview

This file contains copy-paste CLI commands and a JSON template to create a CloudFront distribution using the existing OAC (EOZ78FMGQJKO5), tag it `aep_aws`, update the S3 bucket policy, and deploy the frontend.

Step 0 — prerequisites

- AWS CLI configured with credentials for account 624807913752 and region us-east-1.
- `jq` installed (optional but helpful).

Step 1 — create distribution

The CloudFront and S3 policy templates are consolidated into `connector/aws/aws-configs.json` as separate keys. To create the distribution, extract the CloudFront config and pass it to the CLI:

```powershell
# extract CloudFront config to a temp file and create the distribution
cat connector/aws/aws-configs.json | jq '.cloudfrontDistributionConfig' > /tmp/cf-config.json
aws cloudfront create-distribution --distribution-config file:///tmp/cf-config.json > /tmp/cf-create.json
# inspect output
cat /tmp/cf-create.json | jq -r '.Distribution.Id'
cat /tmp/cf-create.json | jq -r '.Distribution.ARN // .Distribution.ARN'
cat /tmp/cf-create.json | jq -r '.Distribution.DomainName'
```

Step 2 — tag distribution (option A: tag key `team` = `aep_aws`)

```powershell
DIST_ID=$(cat /tmp/cf-create.json | jq -r '.Distribution.Id')
DIST_ARN=arn:aws:cloudfront::624807913752:distribution/$DIST_ID
aws cloudfront tag-resource --resource $DIST_ARN --tags 'Items=[{Key=team,Value=aep_aws}]'
```

Option B: tag with tag key `aep_aws` = `true` (if you prefer a dedicated tag key):

```powershell
aws cloudfront tag-resource --resource $DIST_ARN --tags 'Items=[{Key=aep_aws,Value=true}]'
```

Step 3 — update S3 bucket policy

Extract the `s3BucketPolicy` from the consolidated file, update the `AWS:SourceArn`/Distribution ID if needed, then apply it:

```powershell
# write policy to temp file
cat connector/aws/aws-configs.json | jq '.s3BucketPolicy' > /tmp/s3-policy.json
# (optional) edit /tmp/s3-policy.json to replace the distribution id if you created a different one
aws s3api put-bucket-policy --bucket ai-marketplace-624807913752-us-east-1-an --policy file:///tmp/s3-policy.json
```

Step 4 — configure frontend env and build

- In `frontend/.env` set:

```
VITE_CATALOG_URL=https://<CF_DOMAIN>/curated/starter-packs.json
VITE_API_ENDPOINT=
```

- Build & sync:

```powershell
cd frontend
npm ci
npm run build
aws s3 sync dist/ s3://ai-marketplace-624807913752-us-east-1-an/website/ --delete
```

Step 5 — invalidate CloudFront and validate

```powershell
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

Then open `https://<CF_DOMAIN>/` in a browser and verify `fetchCatalog()` loads `curated/starter-packs.json` without 403.

Notes & cost-control (pay-as-you-go recommendations)

- CloudFront is pay-as-you-go: you pay for data transfer out, HTTP(S) requests, and invalidations (beyond free tier). Price class affects which edge locations are used and can reduce cost.
- Recommendations to minimize cost:
  - Keep `PriceClass_100` (US, Canada, EMEA) to lower price; change to `PriceClass_All` only if you need global coverage.
  - Set long TTLs for static `curated/*` objects, use `DefaultTTL`/`MaxTTL` wisely.
  - Avoid frequent invalidations; batch updates and use versioned object keys when possible.
  - Do not enable Lambda@Edge unless required (adds cost).

If you want, I can run these commands from here — confirm you want me to execute them (I will need your AWS CLI environment available), and confirm whether you prefer tag option A (`team=aep_aws`) or option B (key `aep_aws=true`).

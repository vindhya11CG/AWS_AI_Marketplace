# Connector utilities

This folder contains Lambda transform code and helper scripts for managing the curated catalog and demo assets.

## publish_videos.py

Downloads public demo videos referenced in `curated/starter-packs.json` and uploads them to a public S3 prefix so the frontend can play them inline without authentication/CORS issues.

Example usage:

```bash
python publish_videos.py --bucket ai-marketplace-624807913752-us-east-1-an \
  --key curated/starter-packs.json \
  --prefix website/media/videos \
  --cloudfront-id E2GLSEMGFW1O80 \
  --dist-domain d3qsvpfyyr6uc4.cloudfront.net
```

Notes:
- The script only works for publicly reachable source URLs (no auth). If SharePoint links require authentication they will fail to download.
- The script updates the `curated/starter-packs.json` in S3 with the new public URLs and can invalidate CloudFront to pick up changes.

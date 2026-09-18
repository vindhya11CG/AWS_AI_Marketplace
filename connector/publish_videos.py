#!/usr/bin/env python3
"""
publish_videos.py
-----------------
Download demo videos referenced in a curated starter-packs JSON and upload
them to the public S3 bucket so the frontend can play them inline without
SharePoint auth/CORS issues. Updates the `curated/starter-packs.json` with
the new public URLs and (optionally) invalidates CloudFront paths.

Usage:
  python publish_videos.py --bucket my-bucket --key curated/starter-packs.json \
      [--prefix website/media/videos] [--cloudfront-id E2GLSEMGFW1O80] [--dist-domain d3qsvpfyyr6uc4.cloudfront.net]

Notes:
 - Only downloads URLs that are publicly reachable (no auth). If a video
   URL cannot be fetched it will be skipped and left unchanged.
 - Requires AWS credentials in the environment with S3 PutObject and (optional)
   CloudFront CreateInvalidation permissions.
"""

import argparse
import json
import os
import sys
import tempfile
import urllib.request
from urllib.parse import urlparse

try:
    import boto3
except Exception:
    boto3 = None

DEFAULT_PREFIX = 'website/media/videos'


def download_file(url, dest_path, timeout=30):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            content = resp.read()
        with open(dest_path, 'wb') as f:
            f.write(content)
        return True
    except Exception as e:
        print(f"Could not download {url}: {e}")
        return False


def upload_to_s3(s3_client, bucket, key, file_path, content_type=None):
    extra = {}
    if content_type:
        extra['ContentType'] = content_type
    s3_client.upload_file(file_path, bucket, key, ExtraArgs={**extra, 'ACL': 'public-read'})
    return f"https://{bucket}.s3.amazonaws.com/{key}"


def infer_ext_from_url(url):
    p = urlparse(url)
    _, ext = os.path.splitext(p.path)
    return ext or '.mp4'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--bucket', required=True)
    parser.add_argument('--key', default='curated/starter-packs.json')
    parser.add_argument('--prefix', default=DEFAULT_PREFIX)
    parser.add_argument('--cloudfront-id')
    parser.add_argument('--dist-domain')
    parser.add_argument('--region', default=None)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    if boto3 is None:
        print('boto3 is required to run this script. Install it with `pip install boto3`.')
        sys.exit(2)

    session = boto3.session.Session()
    s3 = session.client('s3', region_name=args.region) if args.region else session.client('s3')
    cf = session.client('cloudfront', region_name=args.region) if args.cloudfront_id else None

    print(f"Reading curated JSON from s3://{args.bucket}/{args.key}")
    obj = s3.get_object(Bucket=args.bucket, Key=args.key)
    data = json.loads(obj['Body'].read().decode('utf-8-sig'))

    updated = False
    tmpdir = tempfile.mkdtemp(prefix='publish_videos_')

    industries = data if isinstance(data, list) else data.get('industries') or data.get('starterPacks') or []
    # If top-level is {industries:[], domains:[]}
    if not industries and isinstance(data, dict) and 'industries' in data:
        industries = data['industries']

    for industry in industries:
        for pack in industry.get('starterPacks', []):
            src_url = pack.get('videoUrl')
            if not src_url or src_url.strip().lower().startswith('https://'+args.bucket):
                continue
            # attempt to download
            ext = infer_ext_from_url(src_url)
            safe_id = pack.get('id') or pack.get('title', 'pack').lower().replace(' ', '-')
            filename = f"{safe_id}{ext}"
            local_path = os.path.join(tmpdir, filename)
            print(f"Attempting download of {src_url} -> {local_path}")
            ok = download_file(src_url, local_path)
            if not ok:
                print(f"Skipping {pack.get('title')} - could not download source video.")
                continue
            s3_key = f"{args.prefix}/{filename}"
            if args.dry_run:
                print(f"DRY RUN: would upload {local_path} to s3://{args.bucket}/{s3_key}")
            else:
                print(f"Uploading to s3://{args.bucket}/{s3_key}")
                public_url = upload_to_s3(s3, args.bucket, s3_key, local_path, content_type='video/mp4')
                # Prefer CloudFront domain if provided
                if args.dist_domain:
                    public_url = f"https://{args.dist_domain}/{s3_key}"
                pack['videoUrl'] = public_url
                updated = True

    if updated and not args.dry_run:
        # Save back to S3 (write curated starter packs key)
        print(f"Writing updated curated JSON back to s3://{args.bucket}/{args.key}")
        s3.put_object(Bucket=args.bucket, Key=args.key, Body=json.dumps(data, ensure_ascii=False, indent=2).encode('utf-8'), ContentType='application/json', ACL='public-read')

        if cf and args.cloudfront_id:
            # create invalidation for updated paths
            invalidation_paths = [f"/{args.prefix}/*", f"/{args.key}"]
            print(f"Creating CloudFront invalidation for {invalidation_paths}")
            cf.create_invalidation(DistributionId=args.cloudfront_id, InvalidationBatch={'Paths':{'Quantity':len(invalidation_paths),'Items':invalidation_paths},'CallerReference':str(int(os.times()[4]*1000000))})

    print('Done.')


if __name__ == '__main__':
    main()

# Migration Gaps

## Scope

This document tracks the remaining gaps in the migration from the legacy SharePoint/SPFx-based marketplace flow to the AWS-backed frontend and ingestion pipeline.

## Migration Status

Completed migration work:

- Public frontend is served from S3 + CloudFront under `/website/`.
- CloudFront distribution `E2GLSEMGFW1O80` is configured with OAC `EOZ78FMGQJKO5`.
- S3 bucket policy has been updated to allow CloudFront access to curated assets.
- Frontend now reads curated starter-pack data from CloudFront and falls back to bundled `frontend/starter-packs.json`.
- SharePoint importer/sync UI has been removed from the public marketplace experience.
- AWS config artifacts were consolidated into `connector/aws/aws-configs.json`.

## Remaining Gaps

### 1. Root documentation is still pre-migration

Current state:
- The root `README.md` still describes the old SPFx sample and does not explain the AWS architecture, frontend deployment path, or curated catalog flow.

Impact:
- New developers and reviewers will get the wrong setup path and wrong mental model for the system.

Recommended action:
- Replace the root README with current architecture, local dev steps, deployment flow, and links to AWS operational docs.

### 2. Direct API usage is not production-ready

Current state:
- The frontend is configured to prefer the API endpoint when present, but the Lambda Function URL path previously showed intermittent 403 behavior in browser-facing flows.
- The current user experience is stable because CloudFront-hosted curated JSON is the primary source and the frontend has a local fallback.

Impact:
- Live browser-side sync, comments, ratings, or future dynamic catalog operations may fail if they rely on direct function URL access.

Recommended action:
- Finalize function URL policy/CORS validation or front the Lambda/API path with API Gateway or CloudFront behavior designed for browser traffic.

### 3. Catalog ownership is split across two sources

Current state:
- Runtime data can come from CloudFront/S3 curated JSON.
- The frontend also keeps a bundled fallback copy in `frontend/starter-packs.json`.

Impact:
- If curated S3 data changes and the bundled file is not refreshed, local fallback content can drift from the live catalog.

Recommended action:
- Define a single source-of-truth policy and add a lightweight sync/check step that validates bundled fallback content against curated output.

### 4. Deployment remains mostly manual

Current state:
- Build, S3 sync, curated JSON upload, and CloudFront invalidations are being run manually.
- Operational commands are documented, but they are not yet enforced by CI/CD.

Impact:
- Releases depend on operator discipline, and missed invalidations or wrong working directories can create stale or partial deployments.

Recommended action:
- Add a repeatable deployment script or CI workflow that builds the frontend, uploads curated artifacts, syncs `website/`, and invalidates CloudFront deterministically.

### 5. Migration verification is incomplete

Current state:
- Validation has been done through manual smoke tests, S3 object checks, CloudFront fetches, and Lambda log inspection.
- There is no automated browser-level regression test covering starter-pack rendering after deployment.

Impact:
- A future change can silently break the homepage, catalog fetch path, or curated JSON shape without early detection.

Recommended action:
- Add a minimal E2E check that loads the deployed site and asserts representative starter packs and domain groupings are visible.

### 6. Legacy surfaces are still present in the repository

Current state:
- The `archive/spfx/` tree remains in the repo, while the new runtime path is the Vite frontend + AWS connector flow.

Impact:
- It is still easy to confuse historical SPFx implementation details with the current deployed application.

Recommended action:
- Mark the archive explicitly as legacy in the root documentation and define whether it should remain for reference or be moved to a separate archival branch.

## Recommended Closure Order

1. Replace the root README with current architecture and deployment guidance.
2. Stabilize browser-safe API access for dynamic operations.
3. Automate deployment and curated-catalog publication.
4. Add an end-to-end regression check.
5. Decide long-term handling of legacy SPFx assets.

## Current Low-Risk Operating Mode

Until the remaining gaps are closed, the safest production/demo path is:

- publish curated starter packs to S3,
- serve them through CloudFront,
- deploy the frontend to `website/`, and
- rely on the bundled fallback only as a resilience mechanism, not as the primary catalog source.
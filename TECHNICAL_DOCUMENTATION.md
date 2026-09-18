# AWS AI Marketplace - Technical Documentation

## 1. Overview & Architecture Summary

The **AWS AI Marketplace** (Amplifier for Agentic Experience) is an enterprise catalog and discovery portal for AI Starter Packs and Domain-specific Autonomous Agents. It bridges enterprise SharePoint knowledge bases with modern AWS cloud infrastructure, providing an interactive, Cloudscape-styled Single Page Application (React + Vite) backed by AWS S3, AWS Lambda, and Microsoft Graph / SharePoint REST APIs.

```
+------------------------------------+
|    Enterprise SharePoint List      |
|  - Demo Videos (SharePoint URLs)   |
|  - Starter Pack Specifications     |
|  - Agent Architectures & ROI       |
+-----------------+------------------+
                  |
         Graph API / REST Ingest
                  v
+-----------------+------------------+
|      AWS S3 (Raw Zone: raw/)       |
+-----------------+------------------+
                  |
        s3:ObjectCreated Event
                  v
+-----------------+------------------+
|       AWS Lambda Connector         |
|  - Normalizes SharePoint schemas   |
|  - Extracts Hyperlink objects      |
|  - Persists Curated Catalog        |
+-----------------+------------------+
                  |
                  v
+-----------------+------------------+
|    AWS S3 (Curated: curated/)      |
|  - starter-packs.json              |
|  - agents.json                     |
|  - marketplace-catalog.json        |
+-----------------+------------------+
                  |
          Public / CDN / API URL
                  v
+-----------------+------------------+
|   React + Cloudscape Frontend      |
|  - Inline Cloudscape Video Player  |
|  - Fluid Responsive Card Grid      |
|  - Real-time Search & Filtering    |
|  - Interactive Ratings & Feedback  |
+------------------------------------+
```

---

## 2. SharePoint Integration & Data Ingestion Pipeline

### 2.1 SharePoint Schema & Field Normalization
SharePoint list items often contain complex nested object types, internal schema aliases (such as `_x0020_` for spaces), and diverse column names depending on list configuration. The connector normalizes these into uniform entities:

| SharePoint Column / Key | Internal Property | Description |
| :--- | :--- | :--- |
| `Demo_x0020_Video`, `Demo Video`, `DemoVideo` | `videoUrl` | URL to demo video (SharePoint stream or MP4) |
| `Agentic_x0020_Link`, `Agentic link` | `agenticLinkUrl` | URL to Agentic Experience launchpad |
| `Click_x0020_Through_x0020_Demo` | `quickLinks.demo` | Navattic interactive simulation link |
| `Problem_x0020_Solved`, `Problem Solved` | `problemSolved` | Business problem statement |
| `Solution_x0020_Summary`, `Solution Summary` | `solutionDescription` | Core solution overview |
| `Expected_x0020_ROI_x0020_Metrics` | `roiMetrics` | Parsed time savings, cost reduction, metrics |
| `Rating_x0020__x0028_0_x002d_5_x0029_` | `ratings.score` | Aggregate user rating (1–5) |

### 2.2 Hyperlink Object Extraction
SharePoint frequently returns hyperlinks as nested dictionary objects:
```json
{
  "Demo Video": {
    "Url": "https://capgemini.sharepoint.com/sites/KnowNow/AI/Smart_Loan_Origination.mp4",
    "Description": "Loan Origination Demo"
  }
}
```
The helper function `_first` in `connector/lambda_function.py` was enhanced to detect and extract `.Url` or `.url` properties automatically, ensuring clean string URLs are propagated to downstream curated catalogs.

### 2.3 S3 Storage Architecture
- **Raw Zone (`s3://<bucket>/raw/`)**: Stores incoming JSON exports or webhook payloads from SharePoint.
- **Curated Zone (`s3://<bucket>/curated/`)**: Stores transformed, production-ready catalog files (`starter-packs.json`, `agents.json`, `marketplace-catalog.json`).
- **Bucket Policy & CORS**: Configured with public read on `curated/*` and CORS enabled for `GET` and `HEAD` from web origins.

### 2.4 Synchronization & Publishing
- **Automated Ingestion**: An S3 bucket notification invokes `ai-marketplace-transform` whenever files land in `raw/`.
- **Manual / Direct Sync (`connector/publish_videos.py`)**: A Python utility providing direct synchronization of SharePoint video URLs, updating local curated files and uploading directly to S3 with verification.

---

## 3. Inline Cloudscape Video Player (`SimpleVideoPlayer`)

### 3.1 Design Philosophy & User Experience
The video component is designed to provide an AWS Cloudscape-native media player experience directly within the starter pack detail modal without requiring external tab redirects:
- **No Tab Redirection**: Videos play directly within the modal on the same page.
- **Click Anywhere to Play/Pause**: Clicking anywhere on the video space immediately toggles playback.
- **Dynamic Animated Feedback**: Displays a centered pulse ripple icon (`play` or `pause`) on every click.
- **Space-Bar Shortcut**: Space key toggles play/pause.
- **Full Cloudscape Playback Bar**:
  - **Timeline Scrubber**: Smooth interactive range slider styled with Cloudscape AWS blue (`#0972d3`).
  - **Volume Slider & Mute**: Slider with instant mute toggle.
  - **Playback Speed**: Cycles through `1x`, `1.25x`, `1.5x`, and `2x`.
  - **Fullscreen Toggle**: Native Fullscreen API integration.
  - **Time Display**: Monospaced tabular time indicator (`0:15 / 1:45`).
- **Clean Aesthetic**: Removed unnecessary subtitle clutter (such as `"Linked: ..."`) while displaying an elegant top overlay with `"Solution Demo"` badge, pack title, and duration pill.

### 3.2 Robust CORS & Authentication Fallback
Enterprise SharePoint videos may enforce Microsoft 365 tenant authentication or strict CORS headers that restrict direct in-browser HTML5 `<video>` rendering. When playback fails or triggers an error:
- The component automatically activates an internal fallback demo stream (`BigBuckBunny.mp4`).
- Playback continues seamlessly without freezing the modal UI or disrupting the user journey.

### 3.3 Launch in Workspace Action
The previous bottom-right "Pause demo video" button was removed. The primary modal action is now a dedicated **"Launch in Workspace ↗"** button, architected to support future redirects to external workflow engines and staging workspaces.

---

## 4. Frontend UI/UX Enhancements

### 4.1 Fluid Responsive Card Grid
- Grid template configured with `repeat(auto-fill, minmax(200px, 1fr))` ensuring at least 3 cards per row on standard desktop viewports.
- Clean typography hierarchy: 15px titles, clamped descriptions, clear business benefit callouts, and category pills.
- Dedicated "Launch" and "View details" buttons on every card.

### 4.2 Segmented Toolbar & Animated Search
- Segmented toggle to switch between **Starter Packs** and **Domain Agents**.
- Integrated `GooeySearchBar` with live suggestion filtering.
- Compact "Expand All" / "Collapse All" accordion toggle.
- "Create your own Starter Pack" action.

### 4.3 Interactive Rating System
- 5-star interactive rating component with persistent submission to the Lambda backend (`POST /items/{id}/ratings`).
- Backend validates ratings between 1 and 5 and updates aggregate scores and rating counts across both starter packs and domain agents.

---

## 5. Code Consolidation Architecture

To maintain a lean and maintainable codebase, redundant files are consolidated:

1. **Consolidated AWS Policies (`connector/aws-policies.json`)**:
   - Merges IAM Execution Role Policy, S3 Curated Read Bucket Policy, S3 CORS Policy, and Lambda Trust Policy into a single structured configuration.
2. **Consolidated Modal & Video Player (`StarterPackDetailModal.jsx`)**:
   - Embeds `SimpleVideoPlayer` directly inside the modal component, unifying video rendering, controls, and modal state in one consolidated file.
3. **Consolidated Accordions (`MarketplaceAccordion.jsx`)**:
   - Unifies `IndustryAccordion` (Starter Packs) and `DomainAccordion` (Agents) into a single reusable accordion list.
4. **Consolidated Card Grid (`MarketplaceCardGrid.jsx`)**:
   - Unifies `StarterPackCard` and `AgentCard` into a single reusable card grid with support for capabilities, tags, and launch triggers.

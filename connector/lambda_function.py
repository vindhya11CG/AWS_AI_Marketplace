"""
lambda_function.py
------------------
S3-triggered AWS Lambda transform for the AI Marketplace pipeline.

Pipeline (all AWS, SharePoint is the only external source):

    SharePoint List
        -> Amazon AppFlow (SharePoint connector)   [ingestion, no code]
        -> S3 RAW zone  (raw-list.json)
        -> THIS LAMBDA  (triggered by S3 ObjectCreated)   [transform]
        -> S3 CURATED zone (starter-packs.json)
        -> CloudFront -> React + Cloudscape SPA

The Lambda reads the raw SharePoint export that AppFlow drops in the RAW
bucket, normalizes each row into the app's starter-pack shape, groups the
packs by industry (the `INDUSTRIES` structure the frontend expects), and
writes `starter-packs.json` to the CURATED bucket.

Environment variables:
    CURATED_BUCKET   (required) destination bucket for the normalized catalog
    CURATED_KEY      (optional) destination key, default "curated/starter-packs.json"
    RAW_PREFIX       (optional) only objects under this prefix are processed,
                     default "raw/" - this prevents the curated write from
                     re-triggering the Lambda (infinite loop protection)
    RESOURCE_TAG     (optional) team tag value, default "aep_aws"

The same S3 bucket is used for both zones via prefixes:
    s3://<bucket>/raw/       <- Amazon AppFlow writes here (trigger)
    s3://<bucket>/curated/   <- this Lambda writes starter-packs.json here

No Microsoft SDKs, secrets, or Graph calls live here - AppFlow handles the
SharePoint OAuth entirely. boto3 is provided by the Lambda runtime.
"""

import json
import os
import re
import urllib.parse

import boto3

s3 = boto3.client("s3")

CURATED_BUCKET = os.environ.get("CURATED_BUCKET")
CURATED_KEY = os.environ.get("CURATED_KEY", "curated/starter-packs.json")
RAW_PREFIX = os.environ.get("RAW_PREFIX", "raw/")
RESOURCE_TAG = os.environ.get("RESOURCE_TAG", "aep_aws")

DEFAULT_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
DEFAULT_DEMO = "https://sogeti.navattic.com/flowofagenticsystem?g=cmgg9vmwh000004lccfo0cg8o&s=0"


# --- helpers -----------------------------------------------------------------
def _first(item, *keys, default=""):
    """Return the first non-empty value among the given keys.
    Handles SharePoint Choice objects (e.g., {'Value': '...'}) automatically.
    """
    if not isinstance(item, dict):
        return default

    for k in keys:
        if k in item and item[k] not in (None, ""):
            val = item[k]
            # Handle SharePoint Choice / Lookup objects from Logic Apps
            if isinstance(val, dict):
                if "Value" in val and val["Value"] not in (None, ""):
                    return val["Value"]
                if "value" in val and not isinstance(val.get("value"), list) and val["value"] not in (None, ""):
                    return val["value"]
            return val
    return default


def _slug(text):
    return re.sub(r"[^a-z0-9]+", "-", str(text).lower()).strip("-")


def _strip_html(text):
    return re.sub(r"<[^>]+>", "", str(text))


def normalize_sharepoint_item(raw):
    """Port of the frontend normalizeSharePointItem() to Python.

    Maps the SharePoint "Industrialized Use cases" columns (both display names
    and Logic App OData-encoded names like Agent_x0020_Name) into the starter-pack
    shape the React app renders.
    """
    title = _first(
        raw, "Agent Name", "Agent_x0020_Name", "Title", "title", "name",
        default="Untitled Starter Pack",
    )

    raw_id = _first(raw, "Id", "ID", "id", "ItemInternalId")
    item_id = str(raw_id) if raw_id else _slug(title)

    industry_name = _first(
        raw, "Industry", "industry", "BusinessLine", "Business Line", "BusinessLine1", "Category",
        default="General / Other",
    )

    description = _strip_html(_first(
        raw, "Solution Summary", "Solution_x0020_Summary", "Description", "description",
        "SolutionSummary", "field_4", "Brief description",
    )).strip()
    tagline = _strip_html(_first(raw, "Tagline", "tagline")).strip()
    if not tagline and description:
        tagline = description[:100] + ("..." if len(description) > 100 else "")

    problem_solved = _strip_html(_first(
        raw, "Problem Solved", "Problem_x0020_Solved", "ProblemSolved", "problemSolved", "field_2",
    )).strip()
    solution_description = _strip_html(_first(
        raw, "Solution Summary", "Solution_x0020_Summary", "Long Description",
        "SolutionDescription", "solutionDescription", "field_3", default=description,
    )).strip()

    # --- Agents Involved -> agentPipeline ---
    agent_pipeline = []
    raw_agents = _first(
        raw, "Agents Involved", "Agents_x0020_Involved", "AgentsInvolved",
        "agentPipeline", "High level workflow", "field_6",
    )
    if isinstance(raw_agents, list):
        for a in raw_agents:
            if isinstance(a, str):
                agent_pipeline.append({"name": a, "role": "Autonomous Multi-Agent Step"})
            elif isinstance(a, dict):
                agent_pipeline.append(a)
    elif isinstance(raw_agents, str) and raw_agents.strip():
        # Match "AgentName [AgentRole]" patterns or HTML divs
        div_lines = re.findall(r"(?:<div>|<p>)(.*?)(?:</div>|</p>)", raw_agents, flags=re.IGNORECASE)
        lines = div_lines if div_lines else [s.strip() for s in re.split(r"\r?\n|>|;", _strip_html(raw_agents)) if s.strip()]
        for raw_ln in lines:
            ln = _strip_html(raw_ln).strip()
            if not ln:
                continue
            m = re.match(r"^([^\[]+)\s*\[([\s\S]*)\]$", ln)
            if m:
                agent_pipeline.append({"name": m.group(1).strip(), "role": m.group(2).strip()})
            else:
                agent_pipeline.append({"name": ln, "role": "Autonomous Multi-Agent Step"})

    if not agent_pipeline:
        agent_pipeline = [
            {"name": "Intelligent Ingestion Agent", "role": "Parses incoming task inputs"},
            {"name": "Core Processing Agent", "role": "Applies domain intelligence models"},
            {"name": "Validation & Sign-Off Agent", "role": "Certifies output quality and compliance"},
        ]

    # --- Availability / Hyperscalers ---
    availability = []
    raw_avail = _first(raw, "Availability", "availability", "Supported hyperscalers", "Platforms")
    if isinstance(raw_avail, list):
        for a in raw_avail:
            if isinstance(a, dict) and "Value" in a:
                availability.append(str(a["Value"]))
            else:
                availability.append(str(a))
    elif isinstance(raw_avail, str) and raw_avail.strip():
        availability = [s.strip() for s in re.split(r"\r?\n|,|;", raw_avail) if s.strip()]
    if not availability:
        availability = ["Amplifier for Agentic Experience", "Azure AI Foundry", "Amplifier for Foundations"]

    # --- ROI Metrics ---
    roi_metrics = {
        "timeSavings": "~50%",
        "timeLabel": "efficiency gain",
        "costSavings": "~30%",
        "costLabel": "cost reduction",
        "summary": "Accelerates turnaround and cuts operational overhead.",
    }
    raw_roi = _first(
        raw, "Expected ROI Metrics", "Expected_x0020_ROI_x0020_Metrics",
        "ExpectedRoiMetrics", "roiMetrics", "Impact", "field_7",
    )
    if isinstance(raw_roi, dict):
        roi_metrics.update(raw_roi)
    elif isinstance(raw_roi, list):
        matches = [str(m) for m in raw_roi]
        if len(matches) >= 2:
            roi_metrics["timeSavings"] = matches[0].split(" ")[0].strip("[]'\"")
            roi_metrics["timeLabel"] = matches[0].replace(roi_metrics["timeSavings"], "").strip("[]'\" ")
            roi_metrics["costSavings"] = matches[1].split(" ")[0].strip("[]'\"")
            roi_metrics["costLabel"] = matches[1].replace(roi_metrics["costSavings"], "").strip("[]'\" ")
        elif len(matches) == 1:
            roi_metrics["summary"] = str(matches[0]).strip("[]'\"")
    elif isinstance(raw_roi, str) and raw_roi.strip():
        matches = re.findall(r"(\d+%\s*[^,\n;']+)", raw_roi)
        if len(matches) >= 2:
            roi_metrics["timeSavings"] = matches[0].split(" ")[0]
            roi_metrics["timeLabel"] = matches[0].replace(roi_metrics["timeSavings"], "").strip()
            roi_metrics["costSavings"] = matches[1].split(" ")[0]
            roi_metrics["costLabel"] = matches[1].replace(roi_metrics["costSavings"], "").strip()
        else:
            clean_str = raw_roi.strip("[]'\"")
            if clean_str:
                roi_metrics["summary"] = clean_str

    # --- ratings ---
    score = 5.0
    count = 10
    raw_ratings_str = _first(raw, "Ratings", "ratings")
    if isinstance(raw_ratings_str, str) and raw_ratings_str.strip():
        parts = [float(p.strip()) for p in raw_ratings_str.split(",") if p.strip() and p.strip().replace(".", "", 1).isdigit()]
        if parts:
            score = round(sum(parts) / len(parts), 1)
            count = len(parts)
    else:
        try:
            score = float(_first(
                raw, "Rating (0-5)", "Rating_x0020__x0028_0_x002d_5_x0029_",
                "Rating_x0028_0_x002d_5_x0029_", "Rating", "rating", default=5,
            ))
        except (TypeError, ValueError):
            score = 5.0
        try:
            count = int(float(_first(
                raw, "Number of Ratings", "Number_x0020_of_x0020_Ratings",
                "NumberOfRatings", "ratingCount", default=10,
            )))
        except (TypeError, ValueError):
            count = 10

    quick_links = [
        {"id": "demo", "label": "Click Through Demo", "icon": "video",
         "url": _first(raw, "ClickThroughDemo", "Click Through Demo", "Click_x0020_Through_x0020_Demo", "demoUrl", default=DEFAULT_DEMO)},
        {"id": "deck", "label": "Pitch Deck", "icon": "deck",
         "url": _first(raw, "PitchDeck", "Pitch Deck", "Pitch_x0020_Deck", "deckUrl",
                       default="https://capgemini.sharepoint.com/sites/KnowNow/_layouts/15/viewer.aspx")},
        {"id": "setup", "label": "Workflow Setup Instructions", "icon": "workflow",
         "url": _first(raw, "WorkflowSetupInstructions", "Workflow Setup Instructions", "Workflow_x0020_Setup_x0020_Instructions", "setupUrl",
                       default="https://capgemini.sharepoint.com/sites/KnowNow/AIMarketplace/SitePages/Workflow-Instructions.aspx")},
        {"id": "sample", "label": "Sample Input File", "icon": "file",
         "url": _first(raw, "SampleInputFile", "Sample Input File", "Sample_x0020_Input_x0020_File", "sampleUrl",
                       default="https://capgemini.sharepoint.com/sites/KnowNow/AIMarketplace/SiteAssets/Sample_Loan_Application_Data.csv")},
    ]

    agentic_link = _first(
        raw, "AgenticLink", "Agentic Link", "Agentic_x0020_Link", "agenticLink",
        default="https://agenticexperience.azurewebsites.net/login",
    )
    video_url = _first(
        raw, "DemoVideo", "Demo Video", "Demo_x0020_Video", "videoUrl", "Video",
        default=DEFAULT_VIDEO,
    )
    benefits = _strip_html(_first(
        raw, "Key Benefits", "Key_x0020_Benefits", "Benefits", "benefits",
        "KeyBenefits", "field_8", default="Accelerates idea-to-production with automated compliance.",
    )).strip()

    return {
        "id": item_id,
        "title": title,
        "tagline": tagline,
        "description": description,
        "industry": industry_name,
        "category": _first(raw, "Category", default=industry_name.split(" ")[0]),
        "benefits": _first(raw, "Benefits", "benefits", "Impact",
                           default="Accelerates idea-to-production with automated compliance."),
        "demoAvailable": True,
        "agenticLinkUrl": agentic_link,
        "videoUrl": _first(raw, "Demo Video", "Demo_x0020_Video", "videoUrl", default=DEFAULT_VIDEO),
        "duration": _first(raw, "duration", default="1:45"),
        "problemSolved": problem_solved,
        "solutionDescription": solution_description,
        "agentPipeline": agent_pipeline,
        "availability": availability,
        "roiMetrics": roi_metrics,
        "ratings": {"score": score, "maxScore": 5, "count": count},
        "quickLinks": quick_links,
        "comments": [],
    }


def group_by_industry(packs):
    """Group normalized packs into the INDUSTRIES structure the SPA expects."""
    industries = {}
    order = []
    for pack in packs:
        name = pack.get("industry") or "General / Other"
        if name not in industries:
            industries[name] = {"id": _slug(name), "name": name, "starterPacks": []}
            order.append(name)
        industries[name]["starterPacks"].append(pack)
    return [industries[n] for n in order]


def parse_raw_body(body_text):
    """Parse an AppFlow / SharePoint export into a list of raw item dicts.

    Handles: JSON array, {"value": [...]}, {"d": {"results": [...]}},
    newline-delimited JSON (AppFlow default), or a single object.
    Automatically handles UTF-8 BOM characters.
    """
    body_text = body_text.lstrip("\ufeff").strip()
    if not body_text:
        return []

    # Try a single JSON document first.
    try:
        data = json.loads(body_text)
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            if isinstance(data.get("value"), list):
                return data["value"]
            if isinstance(data.get("d"), dict) and isinstance(data["d"].get("results"), list):
                return data["d"]["results"]
            return [data]
    except json.JSONDecodeError:
        pass

    # Fall back to newline-delimited JSON (one object per line).
    items = []
    for line in body_text.splitlines():
        line = line.lstrip("\ufeff").strip()
        if line:
            items.append(json.loads(line))
    return items


def build_catalog(raw_items):
    """Full transform: filter published -> normalize -> group by industry."""
    published = []
    for item in raw_items:
        # AppFlow may nest the actual fields; unwrap if needed.
        fields = item.get("fields", item) if isinstance(item, dict) else item
        status = str(_first(fields, "Status", "status", default="Published")).lower()
        if status and status != "published":
            continue
        published.append(normalize_sharepoint_item(fields))
    return group_by_industry(published)


# --- Lambda entry point ------------------------------------------------------
def lambda_handler(event, context):
    if not CURATED_BUCKET:
        raise RuntimeError("CURATED_BUCKET environment variable is not set.")

    # Check if this is an S3 trigger event or a direct HTTP / Function URL call
    records = event.get("Records", [])
    
    if records:
        # --- Invocation from S3 ObjectCreated event ---
        total_packs = 0
        catalog = []
        for record in records:
            src_bucket = record["s3"]["bucket"]["name"]
            src_key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])

            if RAW_PREFIX and not src_key.startswith(RAW_PREFIX):
                print(f"Skipping s3://{src_bucket}/{src_key} - not under '{RAW_PREFIX}'")
                continue

            print(f"Reading raw export from s3://{src_bucket}/{src_key}")
            obj = s3.get_object(Bucket=src_bucket, Key=src_key)
            body = obj["Body"].read().decode("utf-8-sig")

            raw_items = parse_raw_body(body)
            catalog = build_catalog(raw_items)
            total_packs = sum(len(ind["starterPacks"]) for ind in catalog)

            s3.put_object(
                Bucket=CURATED_BUCKET,
                Key=CURATED_KEY,
                Body=json.dumps(catalog, ensure_ascii=False, indent=2).encode("utf-8"),
                ContentType="application/json",
                Tagging=f"team={RESOURCE_TAG}",
            )
            print(f"Wrote {len(catalog)} industries / {total_packs} packs to s3://{CURATED_BUCKET}/{CURATED_KEY}")

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"statusCode": 200, "industries": len(catalog), "starterPacks": total_packs}),
        }

    else:
        # --- Direct HTTP / Logic App Function URL invocation ---
        print("Received direct HTTP payload from Logic App.")
        body_data = event.get("body")
        if body_data:
            if isinstance(body_data, str):
                raw_items = parse_raw_body(body_data)
            elif isinstance(body_data, (list, dict)):
                raw_items = parse_raw_body(json.dumps(body_data))
            else:
                raw_items = []
        elif isinstance(event, list):
            raw_items = event
        elif isinstance(event, dict):
            raw_items = parse_raw_body(json.dumps(event))
        else:
            raw_items = []

        # Archive raw payload to raw/ zone for audit lineage
        try:
            s3.put_object(
                Bucket=CURATED_BUCKET,
                Key="raw/sharepoint-list.json",
                Body=json.dumps(raw_items, ensure_ascii=False, indent=2).encode("utf-8"),
                ContentType="application/json",
                Tagging=f"team={RESOURCE_TAG}",
            )
        except Exception as e:
            print(f"Warning: could not save raw backup: {e}")

        catalog = build_catalog(raw_items)
        total_packs = sum(len(ind["starterPacks"]) for ind in catalog)

        s3.put_object(
            Bucket=CURATED_BUCKET,
            Key=CURATED_KEY,
            Body=json.dumps(catalog, ensure_ascii=False, indent=2).encode("utf-8"),
            ContentType="application/json",
            Tagging=f"team={RESOURCE_TAG}",
        )
        print(f"HTTP Sync complete: {len(catalog)} industries / {total_packs} packs written to s3://{CURATED_BUCKET}/{CURATED_KEY}")

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "status": "success",
                "industries": len(catalog),
                "starterPacks": total_packs,
            }),
        }


# --- Local testing -----------------------------------------------------------
# Usage: python lambda_function.py path/to/raw-export.json
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python lambda_function.py <raw-export.json> [output.json]")
        sys.exit(1)

    in_path = sys.argv[1]
    out_path = sys.argv[2] if len(sys.argv) > 2 else "starter-packs.json"

    with open(in_path, "r", encoding="utf-8-sig") as f:
        raw_items = parse_raw_body(f.read())

    catalog = build_catalog(raw_items)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    packs = sum(len(ind["starterPacks"]) for ind in catalog)
    print(f"Wrote {len(catalog)} industries / {packs} packs to {out_path}")

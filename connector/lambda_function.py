"""
lambda_function.py
------------------
Serverless AWS Lambda connector and ETL transform for the AI Marketplace pipeline.
Connects Microsoft SharePoint list data to Amazon S3 and serves live endpoints
for the React / Cloudscape frontend.

Pipeline Architecture:
    SharePoint Lists
      1) "Industrialized Use cases" (Starter Packs)
      2) "Operational Excellence Agents" (Enterprise Agents)
          │
          ├─► Amazon AppFlow (Scheduled ingestion to S3 RAW)
          ├─► Azure Logic App / Power Automate (HTTP Webhook to API Gateway / Function URL)
          └─► Direct Microsoft Graph API polling (via /sync-graph)
          │
          ▼
      S3 RAW Zone (s3://<bucket>/raw/...)
          │
          ▼
      THIS LAMBDA (Triggered by S3 ObjectCreated OR API Gateway HTTP requests)
          ├─ Ingests & validates raw SharePoint list data
          ├─ Normalizes fields (handles OData fields, Choice dicts, agents pipeline)
          ├─ Groups into catalog structures (by Industry for Packs, by Domain for Agents)
          ├─ Writes Curated JSON artifacts:
          │    - s3://<bucket>/curated/starter-packs.json
          │    - s3://<bucket>/curated/agents.json
          │    - s3://<bucket>/curated/marketplace-catalog.json
          ▼
      S3 CURATED Zone / CloudFront CDN / API Gateway
          │
          ▼
      React + Cloudscape Frontend (Live dynamic catalog)

Supported Endpoints:
    GET  /catalog                     -> Returns full curated catalog { industries, domains }
    GET  /starter-packs               -> Returns curated starter packs grouped by industry
    GET  /agents                      -> Returns curated agents grouped by domain
    POST /transform  or  POST /sync   -> Ingests raw SharePoint JSON, normalizes & updates S3
    POST /sync-graph                  -> Connects directly to MS Graph API to pull list items
    POST /items/{id}/comments         -> Adds a comment to an item (persisted in S3)
    POST /items/{id}/ratings          -> Submits a 1-5 star rating (persisted in S3)
"""

import json
import os
import re
import urllib.parse
import urllib.request
import urllib.error
from datetime import datetime
try:
    import boto3
    s3 = boto3.client("s3")
except ImportError:
    boto3 = None
    s3 = None

CURATED_BUCKET = os.environ.get("CURATED_BUCKET") or os.environ.get("S3_BUCKET", "ai-marketplace-624807913752-us-east-1-an")
CURATED_KEY = os.environ.get("CURATED_KEY", "curated/starter-packs.json")
CURATED_KEY_STARTER_PACKS = os.environ.get("CURATED_KEY_STARTER_PACKS", CURATED_KEY)
CURATED_KEY_AGENTS = os.environ.get("CURATED_KEY_AGENTS", "curated/agents.json")
CURATED_KEY_CATALOG = os.environ.get("CURATED_KEY_CATALOG", "curated/marketplace-catalog.json")
RAW_PREFIX = os.environ.get("RAW_PREFIX", "raw/")
RESOURCE_TAG = os.environ.get("RESOURCE_TAG", "aep_aws")

# SharePoint Site and List details
SP_HOSTNAME = os.environ.get("SP_HOSTNAME", "capgemini.sharepoint.com")
SP_SITE_PATH = os.environ.get("SP_SITE_PATH", "/sites/KnowNow/AIMarketplace")
SP_LIST_NAME = os.environ.get("SP_LIST_NAME", "Industrialized Use cases")
INGESTION_API_URL = os.environ.get("INGESTION_API_URL", "https://yymryxj4se.execute-api.us-east-1.amazonaws.com/prod/transform")

# Optional Microsoft Graph credentials for direct polling
MS_GRAPH_TENANT_ID = os.environ.get("MS_GRAPH_TENANT_ID")
MS_GRAPH_CLIENT_ID = os.environ.get("MS_GRAPH_CLIENT_ID")
MS_GRAPH_CLIENT_SECRET = os.environ.get("MS_GRAPH_CLIENT_SECRET")
MS_GRAPH_SITE_ID = os.environ.get("MS_GRAPH_SITE_ID")

# Removed hardcoded SharePoint demo video path to avoid embedding tenant-protected URLs
# Default is intentionally empty so that downstream code must explicitly set public video URLs
DEFAULT_VIDEO = ""
DEFAULT_DEMO = "https://sogeti.navattic.com/flowofagenticsystem?g=cmgg9vmwh000004lccfo0cg8o&s=0"


# =============================================================================
# Helper utilities
# =============================================================================

def _first(item, *keys, default=""):
    """Return the first non-empty value among the given keys.
    Handles SharePoint Choice objects, Hyperlink objects (e.g. {'Url': '...'}), and Lookup objects.
    """
    if not isinstance(item, dict):
        return default

    for k in keys:
        if k in item and item[k] not in (None, ""):
            val = item[k]
            if isinstance(val, dict):
                if "Url" in val and val["Url"] not in (None, ""):
                    return val["Url"]
                if "url" in val and val["url"] not in (None, ""):
                    return val["url"]
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


def cors_response(status_code, body_dict):
    """Format standard API Gateway response with permissive CORS headers."""
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        },
        "body": json.dumps(body_dict, ensure_ascii=False, indent=2),
    }


# =============================================================================
# Normalization: Starter Packs ("Industrialized Use cases")
# =============================================================================

def normalize_starter_pack_item(raw):
    """Normalizes raw SharePoint list item from 'Industrialized Use cases'
    into the Starter Pack JSON shape required by the frontend.
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

    # Agent Pipeline
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

    # Availability / Hyperscalers
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
        availability = ["Amplifier for Agentic Experience", "AWS Bedrock Agentic Core", "Amplifier for Foundations"]

    # ROI Metrics
    roi_metrics = {
        "timeSavings": "~60%",
        "timeLabel": "time-to-approval",
        "costSavings": "~35%",
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

    # Ratings
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

    comments = raw.get("comments", [])
    if not isinstance(comments, list):
        comments = []

    return {
        "id": item_id,
        "title": title,
        "tagline": tagline,
        "description": description,
        "industry": industry_name,
        "category": _first(raw, "Category", default=industry_name.split(" ")[0]),
        "benefits": benefits,
        "demoAvailable": True,
        "agenticLinkUrl": agentic_link,
        "videoUrl": video_url,
        "duration": _first(raw, "duration", default="1:45"),
        "problemSolved": problem_solved,
        "solutionDescription": solution_description,
        "agentPipeline": agent_pipeline,
        "availability": availability,
        "roiMetrics": roi_metrics,
        "ratings": {"score": score, "maxScore": 5, "count": count},
        "quickLinks": quick_links,
        "comments": comments,
    }


# =============================================================================
# Normalization: Operational Excellence Agents
# =============================================================================

def normalize_agent_item(raw):
    """Normalizes raw SharePoint list item from 'Operational Excellence Agents'
    into the Agent shape required by the frontend.
    """
    title = _first(
        raw, "Agent Name", "Agent_x0020_Name", "Title", "title", "name",
        default="Untitled Enterprise Agent",
    )
    raw_id = _first(raw, "Id", "ID", "id", "ItemInternalId")
    item_id = str(raw_id) if raw_id else _slug(title)

    domain_name = _first(
        raw, "Domain", "domain", "Industry", "BusinessLine", "Business Line", "Category",
        default="Consultancy",
    )

    description = _strip_html(_first(
        raw, "Description", "description", "Brief description", "Brief_x0020_description",
        "Solution Summary", "field_4", default="",
    )).strip()

    benefits = _strip_html(_first(
        raw, "Benefits", "benefits", "Key Benefits", "Impact", "field_8",
        default="Empowers teams with autonomous decision making and rapid task execution.",
    )).strip()

    # Capabilities
    capabilities = []
    raw_caps = _first(raw, "Capabilities", "capabilities", "Core Capabilities")
    if isinstance(raw_caps, list):
        capabilities = [str(c) for c in raw_caps]
    elif isinstance(raw_caps, str) and raw_caps.strip():
        capabilities = [s.strip() for s in re.split(r"\r?\n|,|;", _strip_html(raw_caps)) if s.strip()]
    if not capabilities:
        capabilities = ["Autonomous Task Execution", "Contextual Reasoning", "Enterprise System Integration"]

    # Ratings
    try:
        score = float(_first(raw, "Rating (0-5)", "Rating", "rating", default=4.8))
    except (TypeError, ValueError):
        score = 4.8
    try:
        count = int(float(_first(raw, "Number of Ratings", "NumberOfRatings", "ratingCount", default=12)))
    except (TypeError, ValueError):
        count = 12

    # Availability
    availability = []
    raw_avail = _first(raw, "Availability", "availability", "Supported hyperscalers", "Platforms")
    if isinstance(raw_avail, list):
        availability = [str(a) for a in raw_avail]
    elif isinstance(raw_avail, str) and raw_avail.strip():
        availability = [s.strip() for s in re.split(r"\r?\n|,|;", raw_avail) if s.strip()]
    if not availability:
        availability = ["Amplifier for Agentic Experience", "AWS Bedrock Agentic Core"]

    comments = raw.get("comments", [])
    if not isinstance(comments, list):
        comments = []

    return {
        "id": item_id,
        "title": title,
        "domain": domain_name,
        "category": domain_name,
        "description": description,
        "benefits": benefits,
        "capabilities": capabilities,
        "demoAvailable": True,
        "ratings": {"score": score, "count": count},
        "availability": availability,
        "comments": comments,
    }


# =============================================================================
# Catalog Grouping Functions
# =============================================================================

def group_by_industry(starter_packs):
    """Groups normalized starter packs into the INDUSTRIES list expected by the SPA."""
    industries = {}
    order = []
    for pack in starter_packs:
        name = pack.get("industry") or "General / Other"
        if name not in industries:
            industries[name] = {"id": _slug(name), "name": name, "starterPacks": []}
            order.append(name)
        industries[name]["starterPacks"].append(pack)
    return [industries[n] for n in order]


def group_by_domain(agents):
    """Groups normalized enterprise agents into the AGENT_DOMAINS list."""
    domains = {}
    order = []
    for agent in agents:
        name = agent.get("domain") or "Consultancy"
        if name not in domains:
            domains[name] = {"id": _slug(name), "name": name, "agents": []}
            order.append(name)
        domains[name]["agents"].append(agent)
    return [domains[n] for n in order]


# =============================================================================
# Body Parser & Catalog Builder
# =============================================================================

def parse_raw_body(body_text):
    """Parses raw body from S3 / AppFlow / HTTP JSON.
    Handles JSON array, OData {"value": [...]}, {"d": {"results": [...]}}, or NDJSON.
    """
    if isinstance(body_text, (list, dict)):
        data = body_text
    else:
        body_text = str(body_text).lstrip("\ufeff").strip()
        if not body_text:
            return []
        try:
            data = json.loads(body_text)
        except json.JSONDecodeError:
            # Fall back to newline-delimited JSON
            items = []
            for line in body_text.splitlines():
                ln = line.lstrip("\ufeff").strip()
                if ln:
                    items.append(json.loads(ln))
            return items

    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        if isinstance(data.get("value"), list):
            return data["value"]
        if isinstance(data.get("d"), dict) and isinstance(data["d"].get("results"), list):
            return data["d"]["results"]
        # If payload contains separate lists:
        if "starterPacks" in data or "agents" in data or "items" in data:
            return data
        return [data]
    return []


def is_agent_item(raw_item):
    """Heuristic to identify whether an item belongs to 'Operational Excellence Agents'."""
    fields = raw_item.get("fields", raw_item) if isinstance(raw_item, dict) else raw_item
    if "capabilities" in fields or "Capabilities" in fields or "Core Capabilities" in fields:
        return True
    if "domain" in fields or "Domain" in fields:
        return True
    # If it has Problem Solved or Agents Involved, it is a starter pack
    if any(k in fields for k in ["Problem Solved", "Problem_x0020_Solved", "Agents Involved", "Agents_x0020_Involved", "agentPipeline"]):
        return False
    return False


def build_full_catalogs(raw_items):
    """Separates and normalizes raw items into Starter Packs and Agents catalogs."""
    raw_packs = []
    raw_agents = []

    # Handle dictionary with explicit keys
    if isinstance(raw_items, dict):
        if "starterPacks" in raw_items and isinstance(raw_items["starterPacks"], list):
            raw_packs.extend(raw_items["starterPacks"])
        if "agents" in raw_items and isinstance(raw_items["agents"], list):
            raw_agents.extend(raw_items["agents"])
        if "items" in raw_items and isinstance(raw_items["items"], list):
            raw_items = raw_items["items"]

    if isinstance(raw_items, list):
        for item in raw_items:
            fields = item.get("fields", item) if isinstance(item, dict) else item
            status = str(_first(fields, "Status", "status", default="Published")).lower()
            if status and status not in ("published", "active", ""):
                continue

            if is_agent_item(fields):
                raw_agents.append(fields)
            else:
                raw_packs.append(fields)

    norm_packs = [normalize_starter_pack_item(p) for p in raw_packs]
    norm_agents = [normalize_agent_item(a) for a in raw_agents]

    industries = group_by_industry(norm_packs) if norm_packs else []
    domains = group_by_domain(norm_agents) if norm_agents else []

    return industries, domains, norm_packs, norm_agents


# =============================================================================
# S3 Helpers
# =============================================================================

def read_s3_json(bucket, key, default=None):
    try:
        obj = s3.get_object(Bucket=bucket, Key=key)
        return json.loads(obj["Body"].read().decode("utf-8-sig"))
    except Exception as e:
        print(f"Notice: could not read s3://{bucket}/{key}: {e}")
        return default


def write_s3_json(bucket, key, data):
    s3.put_object(
        Bucket=bucket,
        Key=key,
        Body=json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8"),
        ContentType="application/json",
        Tagging=f"team={RESOURCE_TAG}",
    )
    print(f"Successfully saved s3://{bucket}/{key}")


# =============================================================================
# Microsoft Graph API Polling (Optional direct SharePoint connection)
# =============================================================================

def fetch_graph_access_token():
    if not (MS_GRAPH_TENANT_ID and MS_GRAPH_CLIENT_ID and MS_GRAPH_CLIENT_SECRET):
        raise ValueError("Microsoft Graph credentials (tenant, client ID, secret) are not set.")

    token_url = f"https://login.microsoftonline.com/{MS_GRAPH_TENANT_ID}/oauth2/v2.0/token"
    params = urllib.parse.urlencode({
        "client_id": MS_GRAPH_CLIENT_ID,
        "client_secret": MS_GRAPH_CLIENT_SECRET,
        "scope": "https://graph.microsoft.com/.default",
        "grant_type": "client_credentials",
    }).encode("utf-8")

    req = urllib.request.Request(token_url, data=params, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req, timeout=10) as resp:
        body = json.loads(resp.read().decode("utf-8"))
        return body["access_token"]


def fetch_sharepoint_list_graph(list_id_or_title):
    token = fetch_graph_access_token()
    encoded_list = urllib.parse.quote(list_id_or_title)
    url = f"https://graph.microsoft.com/v1.0/sites/{MS_GRAPH_SITE_ID}/lists/{encoded_list}/items?expand=fields"
    req = urllib.request.Request(url, method="GET")
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data.get("value", [])


# =============================================================================
# Handlers for Endpoints & Events
# =============================================================================

def handle_s3_event(event):
    """Handles S3 ObjectCreated triggers on s3://<bucket>/raw/*."""
    records = event.get("Records", [])
    total_packs = 0
    total_agents = 0

    for record in records:
        src_bucket = record["s3"]["bucket"]["name"]
        src_key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])

        if RAW_PREFIX and not src_key.startswith(RAW_PREFIX):
            print(f"Skipping s3://{src_bucket}/{src_key} - not under RAW_PREFIX '{RAW_PREFIX}'")
            continue

        print(f"Triggered by raw export at s3://{src_bucket}/{src_key}")
        raw_obj = s3.get_object(Bucket=src_bucket, Key=src_key)
        body = raw_obj["Body"].read().decode("utf-8-sig")
        raw_items = parse_raw_body(body)

        industries, domains, packs, agents = build_full_catalogs(raw_items)

        if industries:
            write_s3_json(CURATED_BUCKET, CURATED_KEY_STARTER_PACKS, industries)
            total_packs += len(packs)
        if domains:
            write_s3_json(CURATED_BUCKET, CURATED_KEY_AGENTS, domains)
            total_agents += len(agents)

        full_catalog = {"industries": industries, "domains": domains}
        write_s3_json(CURATED_BUCKET, CURATED_KEY_CATALOG, full_catalog)

    return cors_response(200, {
        "status": "success",
        "starterPacks": total_packs,
        "agents": total_agents,
    })


def handle_transform_http(event):
    """Handles direct HTTP POST /transform or /sync ingestion."""
    body_data = event.get("body")
    if not body_data:
        return cors_response(400, {"error": "Missing request body"})

    raw_items = parse_raw_body(body_data)

    # Archive raw input to S3 RAW zone for lineage/audit
    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    raw_key = f"{RAW_PREFIX}sharepoint-export-{timestamp}.json"
    try:
        s3.put_object(
            Bucket=CURATED_BUCKET,
            Key=raw_key,
            Body=json.dumps(raw_items, ensure_ascii=False, indent=2).encode("utf-8"),
            ContentType="application/json",
            Tagging=f"team={RESOURCE_TAG}",
        )
    except Exception as e:
        print(f"Warning: could not write raw archive: {e}")

    industries, domains, packs, agents = build_full_catalogs(raw_items)

    # Save to S3 curated locations
    if industries:
        write_s3_json(CURATED_BUCKET, CURATED_KEY_STARTER_PACKS, industries)
    if domains:
        write_s3_json(CURATED_BUCKET, CURATED_KEY_AGENTS, domains)

    full_catalog = {"industries": industries, "domains": domains}
    write_s3_json(CURATED_BUCKET, CURATED_KEY_CATALOG, full_catalog)

    return cors_response(200, {
        "status": "success",
        "message": "SharePoint list data transformed and published to S3 curated zone.",
        "industries": len(industries),
        "starterPacksCount": len(packs),
        "domains": len(domains),
        "agentsCount": len(agents),
        "rawArchive": f"s3://{CURATED_BUCKET}/{raw_key}",
    })


def handle_get_catalog(event):
    """GET /catalog - returns complete live catalog from S3."""
    catalog = read_s3_json(CURATED_BUCKET, CURATED_KEY_CATALOG)
    if not catalog or (not catalog.get("industries") and not catalog.get("domains")):
        # Check individual keys
        packs = read_s3_json(CURATED_BUCKET, CURATED_KEY_STARTER_PACKS, default=[])
        agents = read_s3_json(CURATED_BUCKET, CURATED_KEY_AGENTS, default=[])
        if packs or agents:
            catalog = {"industries": packs, "domains": agents}
        else:
            # Fallback/seed from bundled sample files if S3 is empty
            try:
                base_dir = os.path.dirname(os.path.abspath(__file__))
                sample_p = os.path.join(base_dir, "sample-use-cases.json")
                sample_a = os.path.join(base_dir, "sample-agents.json")
                raw_items = []
                if os.path.exists(sample_p):
                    with open(sample_p, "r", encoding="utf-8-sig") as f:
                        raw_items.extend(parse_raw_body(f.read()))
                if os.path.exists(sample_a):
                    with open(sample_a, "r", encoding="utf-8-sig") as f:
                        raw_items.extend(parse_raw_body(f.read()))
                if raw_items:
                    industries, domains, _, _ = build_full_catalogs(raw_items)
                    catalog = {"industries": industries, "domains": domains}
                    # Attempt to write to S3
                    try:
                        write_s3_json(CURATED_BUCKET, CURATED_KEY_CATALOG, catalog)
                        if industries:
                            write_s3_json(CURATED_BUCKET, CURATED_KEY_STARTER_PACKS, industries)
                        if domains:
                            write_s3_json(CURATED_BUCKET, CURATED_KEY_AGENTS, domains)
                    except Exception as s3_err:
                        print(f"Notice: could not auto-seed S3: {s3_err}")
            except Exception as load_err:
                print(f"Notice: could not load fallback sample data: {load_err}")
                catalog = {"industries": [], "domains": []}

    return cors_response(200, catalog)


def handle_add_comment(event, item_id):
    """POST /items/{id}/comments - adds a comment and updates S3 catalog."""
    body_data = event.get("body")
    if not body_data:
        return cors_response(400, {"error": "Missing comment body"})
    payload = json.loads(body_data) if isinstance(body_data, str) else body_data
    text = payload.get("text", "").strip()
    author = payload.get("author", "Anonymous Colleague")
    created = payload.get("created", datetime.utcnow().strftime("%Y-%m-%d %H:%M"))

    if not text:
        return cors_response(400, {"error": "Comment text cannot be empty"})

    new_comment = {"text": text, "author": author, "created": created}

    # Load starter packs catalog
    industries = read_s3_json(CURATED_BUCKET, CURATED_KEY_STARTER_PACKS, default=[])
    updated = False
    for ind in industries:
        for pack in ind.get("starterPacks", []):
            if pack.get("id") == item_id or _slug(pack.get("title")) == _slug(item_id):
                pack.setdefault("comments", []).insert(0, new_comment)
                updated = True
                break
        if updated:
            break

    if updated:
        write_s3_json(CURATED_BUCKET, CURATED_KEY_STARTER_PACKS, industries)
        # Update master catalog
        domains = read_s3_json(CURATED_BUCKET, CURATED_KEY_AGENTS, default=[])
        write_s3_json(CURATED_BUCKET, CURATED_KEY_CATALOG, {"industries": industries, "domains": domains})
        return cors_response(200, {"status": "success", "comment": new_comment})

    # Check agents
    domains = read_s3_json(CURATED_BUCKET, CURATED_KEY_AGENTS, default=[])
    for dom in domains:
        for agent in dom.get("agents", []):
            if agent.get("id") == item_id or _slug(agent.get("title")) == _slug(item_id):
                agent.setdefault("comments", []).insert(0, new_comment)
                updated = True
                break
        if updated:
            break

    if updated:
        write_s3_json(CURATED_BUCKET, CURATED_KEY_AGENTS, domains)
        write_s3_json(CURATED_BUCKET, CURATED_KEY_CATALOG, {"industries": industries, "domains": domains})
        return cors_response(200, {"status": "success", "comment": new_comment})

    return cors_response(404, {"error": f"Item '{item_id}' not found"})


def handle_submit_rating(event, item_id):
    """POST /items/{id}/ratings - submits rating (1-5) and updates S3 catalog."""
    body_data = event.get("body")
    payload = json.loads(body_data) if isinstance(body_data, str) else (body_data or {})
    try:
        new_rating = float(payload.get("rating", 5))
    except (TypeError, ValueError):
        return cors_response(400, {"error": "Invalid rating value"})
    if not 1 <= new_rating <= 5:
        return cors_response(400, {"error": "Rating must be between 1 and 5"})

    industries = read_s3_json(CURATED_BUCKET, CURATED_KEY_STARTER_PACKS, default=[])
    domains = read_s3_json(CURATED_BUCKET, CURATED_KEY_AGENTS, default=[])
    updated = False
    rated_item = None
    for ind in industries:
        for pack in ind.get("starterPacks", []):
            if pack.get("id") == item_id or _slug(pack.get("title")) == _slug(item_id):
                curr = pack.get("ratings", {"score": 5.0, "count": 10})
                old_score = curr.get("score", 5.0)
                old_count = curr.get("count", 10)
                new_count = old_count + 1
                new_score = round(((old_score * old_count) + new_rating) / new_count, 1)
                pack["ratings"] = {"score": new_score, "maxScore": 5, "count": new_count}
                rated_item = pack
                updated = True
                break
        if updated:
            break

    if not updated:
        for domain in domains:
            for agent in domain.get("agents", []):
                if agent.get("id") == item_id or _slug(agent.get("title")) == _slug(item_id):
                    curr = agent.get("ratings", {"score": 5.0, "count": 10})
                    old_score = curr.get("score", 5.0)
                    old_count = curr.get("count", 10)
                    new_count = old_count + 1
                    new_score = round(((old_score * old_count) + new_rating) / new_count, 1)
                    agent["ratings"] = {"score": new_score, "maxScore": 5, "count": new_count}
                    rated_item = agent
                    updated = True
                    break
            if updated:
                break

    if updated:
        write_s3_json(CURATED_BUCKET, CURATED_KEY_STARTER_PACKS, industries)
        write_s3_json(CURATED_BUCKET, CURATED_KEY_AGENTS, domains)
        write_s3_json(CURATED_BUCKET, CURATED_KEY_CATALOG, {"industries": industries, "domains": domains})
        return cors_response(200, {"status": "success", "ratings": rated_item["ratings"]})

    return cors_response(404, {"error": f"Item '{item_id}' not found"})


# =============================================================================
# Main Lambda Handler
# =============================================================================

def lambda_handler(event, context):
    if not CURATED_BUCKET:
        raise RuntimeError("CURATED_BUCKET environment variable is not set.")

    # 1. S3 Event Trigger
    if "Records" in event:
        return handle_s3_event(event)

    # 2. HTTP Request (API Gateway / Lambda Function URL)
    http_method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "GET")
    raw_path = event.get("path") or event.get("rawPath", "/")

    # Handle OPTIONS for CORS preflight
    if http_method == "OPTIONS":
        return cors_response(200, {"message": "CORS preflight OK"})

    # Route: /sync-graph (Direct Microsoft Graph pull) - Must come before generic /sync
    if http_method == "POST" and "/sync-graph" in raw_path:
        try:
            sp_packs_raw = fetch_sharepoint_list_graph("Industrialized Use cases")
            sp_agents_raw = fetch_sharepoint_list_graph("Operational Excellence Agents")
            combined = {"starterPacks": sp_packs_raw, "agents": sp_agents_raw}
            return handle_transform_http({"body": json.dumps(combined)})
        except Exception as e:
            return cors_response(500, {"error": f"Graph sync failed: {str(e)}"})

    # Route: /transform or /sync (Ingestion endpoint for raw SharePoint list JSON)
    if (http_method == "POST" or http_method == "PUT") and ("/transform" in raw_path or "/sync" in raw_path):
        return handle_transform_http(event)

    if http_method == "GET" and ("/catalog" in raw_path or raw_path == "/"):
        return handle_get_catalog(event)

    if http_method == "GET" and "/starter-packs" in raw_path:
        packs = read_s3_json(CURATED_BUCKET, CURATED_KEY_STARTER_PACKS, default=[])
        return cors_response(200, packs)

    if http_method == "GET" and "/agents" in raw_path:
        agents = read_s3_json(CURATED_BUCKET, CURATED_KEY_AGENTS, default=[])
        return cors_response(200, agents)

    # Route: /items/{id}/comments
    m_comment = re.search(r"/items/([^/]+)/comments", raw_path)
    if m_comment and http_method == "POST":
        return handle_add_comment(event, m_comment.group(1))

    # Route: /items/{id}/ratings
    m_rating = re.search(r"/items/([^/]+)/ratings", raw_path)
    if m_rating and http_method == "POST":
        return handle_submit_rating(event, m_rating.group(1))

    # Default fallback for direct JSON test invocations
    if isinstance(event, dict) and ("body" in event or "starterPacks" in event or "agents" in event):
        return handle_transform_http(event)

    return cors_response(404, {"error": f"Endpoint not found: {http_method} {raw_path}"})


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        filepath = sys.argv[1]
        with open(filepath, "r", encoding="utf-8-sig") as f:
            raw_data = parse_raw_body(f.read())
        industries, domains, packs, agents = build_full_catalogs(raw_data)
        print(f"Parsed {len(packs)} starter packs ({len(industries)} industries) and {len(agents)} agents ({len(domains)} domains).")
        out_file = sys.argv[2] if len(sys.argv) > 2 else "local-catalog.json"
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump({"industries": industries, "domains": domains}, f, ensure_ascii=False, indent=2)
        print(f"Saved local test output to {out_file}")
    else:
        print("Usage: python lambda_function.py <sample-export.json> [output.json]")


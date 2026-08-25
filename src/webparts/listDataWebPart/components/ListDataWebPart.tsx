/* eslint-disable max-lines */
import * as React from "react";
import styles from "./ListDataWebPart.module.scss";
import "./ListDataWebPart.technical.module.scss"; // contains :global(.technicalMode) overrides
import { IListDataWebPartProps } from "./IListDataWebPartProps";
import { _sp } from "../ListDataWebPartWebPart";
// Suppress a few strict linting rules for this large integration file.
// The file performs many dynamic runtime checks against SharePoint shapes
// and third-party runtime objects where narrow typing is not practical.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/explicit-function-return-type */


export interface ITileItem {
  Title: string;
  Id: number;
  [key: string]: string | number | boolean | undefined | object;
}

export interface IListDataWebPartState {
  items: ITileItem[];
  loading: boolean;
  selectedItem?: ITileItem;
  showModal: boolean;
  fieldMap: { [key: string]: string };
  groupedItems: { [key: string]: ITileItem[] };
  collapsedSections: { [key: string]: boolean };
  searchQuery: string;
  toggleClickCount: number;
  toggleButtonText: string;
  activeList: "Starter Pack" | "Agents";
  themeMode: "Business" | "Technical";
    modalTab?: 'overview' | 'business' | 'integration';
  urlFields: string[];
    commentsCollapsed: boolean;
  // ROI UI expansion state per-item (keyed by `${itemId}-${index}`)
  roiExpanded?: { [key: string]: boolean };

  // new fields for comments
  commentsByItem: { [itemId: number]: { text: string; author: string; created: string }[] };
  commentPosting: boolean;
  commentInput: string;
  showContact: boolean;
  // new debug / error fields
  rawCommentsPayload?: any;
  commentError?: string;
  rawRatingPayload?: any;
  ratingError?: string;
}

export default class ListDataWebPart extends React.Component<
  IListDataWebPartProps,
  IListDataWebPartState
> {
  private modalContentRef = React.createRef<HTMLDivElement>();
  // Per-list internal name holders (never reuse across lists)
  private agentsGroupField: string | undefined;
  private agentsTileField: string | undefined;
  private starterGroupField: string | undefined;
  private starterTileField: string | undefined;

  // runtime rating field internal names (discovered after loading fields)
  private ratingAvgField?: string;
  private ratingCountField?: string;


  // runtime pointers to currently active list fields (set in loadList)
  private currentGroupField?: string;
  private currentTileField?: string;

// ─── Tracking ────────────────────────────────────────────────────────────────
private readonly TRACK_API_BASE = "https://sophie-backend-fcc9etfddqg3bmhr.eastus-01.azurewebsites.net";

private trackEvent = (eventName: string, meta?: Record<string, unknown>): void => {
  const userId = this.getCurrentUserId();

  // Use itemTitle as topic_name when available, otherwise fall back to eventName
  const topicName = (meta && meta.itemTitle) ? String(meta.itemTitle) : eventName;

  // Build URL: POST /user/{id}/topic/{topic_name}
  const url = `${this.TRACK_API_BASE}/user/${encodeURIComponent(userId)}/topic/${encodeURIComponent(topicName)}`;

  // Log locally for debugging
  console.debug("[trackEvent]", url, { eventName, ...meta });

  fetch(url, {
    method: "POST",
    headers: { "accept": "application/json" },
    // no body — endpoint only uses path params
  }).catch((err) => {
    console.warn("[trackEvent] Failed to send event:", eventName, err);
  });
};
// ─────────────────────────────────────────────────────────────────────────────
  constructor(props: IListDataWebPartProps) {
    super(props);
    this.state = {
      items: [],
      loading: true,
      selectedItem: undefined,
      showModal: false,
      showContact: false,
      fieldMap: {},
      groupedItems: {},
      collapsedSections: {},
      searchQuery: "",
      toggleClickCount: 0,
      toggleButtonText: "Expand All",
      activeList: "Starter Pack",
      themeMode: "Business",
        modalTab: 'overview',
      urlFields: [],
      // password/auth fields removed
      // initialize comment-related state
      commentsByItem: {},
      commentPosting: false,
      commentInput: "",
      rawCommentsPayload: undefined,
      commentError: "",
      rawRatingPayload: undefined,
      ratingError: "",
      commentsCollapsed: true,
      roiExpanded: {},
    };
  }

  private toggleRoiCard = (key: string): void => {
    this.setState((prev) => ({
      roiExpanded: { ...(prev.roiExpanded || {}), [key]: !prev.roiExpanded?.[key] },
    }));
  };

  // Render availability items as stacked cards with small icons (used in Technical mode)
  private renderAvailabilityWithIcons = (raw: unknown): React.ReactNode => {
    if (raw === null || raw === undefined) return null;
    const s = Array.isArray(raw) ? (raw as any[]).map((x) => String(x)).join('\n') : String(raw || '');
    const parts = s.split(/\r?\n|,|;/).map(p => p.trim()).filter(Boolean);

    const getIcon = (text: string) => {
      const t = (text || '').toLowerCase();
      // special-case: use remote image for Amplifier for Agentic Experience
      if (/amplifier for agentic experience/i.test(text)) {
        const imgUrl = 'https://capgemini.sharepoint.com/:i:/r/sites/KnowNow/SiteAssets/Sophie%20Icons/Bot_logo.png?csf=1&web=1&e=HaI8KR';
        return (
          <a href={imgUrl} target="_blank" rel="noopener noreferrer">
            <img src={imgUrl} alt={text} style={{ width: 24, height: 22, display: 'block', objectFit: 'contain' }} />
          </a>
        );
      }
      // special-case: Azure AI Foundry uses a provided PNG icon
      if (/azure\s*ai\s*foundry/i.test(text) || /azure ai foundry/i.test(t)) {
        const imgUrl = 'https://capgemini.sharepoint.com/:i:/r/sites/KnowNow/SiteAssets/Sophie%20Icons/Azure%20AI%20Foundry.png?csf=1&web=1&e=uVZFBl';
        return (
          <a href={imgUrl} target="_blank" rel="noopener noreferrer">
            <img src={imgUrl} alt={text} style={{ width: 24, height: 22, display: 'block', objectFit: 'contain' }} />
          </a>
        );
      }
      const commonProps = { viewBox: '0 0 20 20', width: 24, height: 22, fill: 'none', xmlns: 'http://www.w3.org/2000/svg' } as any;
      if (/api|endpoint|rest|graphql/.test(t)) return (<svg {...commonProps} aria-hidden="true"><path d="M3 5h14v10H3z" stroke="#9adff0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 9h6" stroke="#9adff0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>);
      if (/db|database|sql|table|store/.test(t)) return (<svg {...commonProps} aria-hidden="true"><ellipse cx="10" cy="5" rx="7" ry="2" stroke="#9adff0" strokeWidth="1.2" fill="none"/><path d="M3 5v6c0 1.1 3.13 2 7 2s7-.9 7-2V5" stroke="#9adff0" strokeWidth="1.2" fill="none"/></svg>);
      if (/cloud|azure|aws|gcp|serverless/.test(t)) return (<svg {...commonProps} aria-hidden="true"><path d="M6 14h8a3 3 0 0 0 0-6 4 4 0 0 0-7.5-1A3 3 0 0 0 6 14z" stroke="#9adff0" strokeWidth="1.2" fill="none"/></svg>);
      if (/agent|amplifier|processor|worker|service/.test(t)) return (<svg {...commonProps} aria-hidden="true"><path d="M10 3v8" stroke="#9adff0" strokeWidth="1.5" strokeLinecap="round"/><path d="M7 11l6-8" stroke="#9adff0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>);
      if (/connector|erp|sap|salesforce|integrat/.test(t)) return (<svg {...commonProps} aria-hidden="true"><path d="M4 10h12" stroke="#9adff0" strokeWidth="1.5" strokeLinecap="round"/><path d="M4 6h12" stroke="#9adff0" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/></svg>);
      return (<svg {...commonProps} aria-hidden="true"><circle cx="10" cy="10" r="3" fill="#9adff0"/></svg>);
    };

    return (
      <div className={styles.availabilityCards} style={{ marginTop: 6 }}>
        {parts.map((p, idx) => (
          <div key={idx} className={styles.availabilityCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-start' }}>
              <span style={{ display: 'inline-flex', width: 20, height: 20 }}>{getIcon(p)}</span>
              <div style={{ textAlign: 'left', fontWeight: 600, fontSize: '0.95rem' }}>{p}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };


  private toggleComments = (): void => {
    this.setState((prev) => ({ commentsCollapsed: !prev.commentsCollapsed }));
  };

  //contact list
  private contactEmails: string[] = ["sogetiaimarketplacesupport.in@capgemini.com "];

  private openContact = (): void => {
    this.setState({ showContact: true });
  };

  private closeContact = (): void => {
    this.setState({ showContact: false });
  }; 

  // Dual-mode theme toggle temporarily disabled per request.
  // private toggleTheme = (mode: "Business" | "Technical"): void => {
  //   this.setState({ themeMode: mode }, () => {
  //     try {
  //       if (mode === "Technical") {
  //         document.body.classList.add("technicalMode");
  //       } else {
  //         document.body.classList.remove("technicalMode");
  //       }
  //     } catch (e) {
  //       // ignore DOM errors in non-browser contexts
  //     }
  //     this.trackEvent("theme_toggle", { mode });
  //   });
  // };

  private hideChrome = (): void => {
    const styleId = "hideModernChrome";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `

        /* Hide modern site header (logo, site title, top nav) */

        div[data-automationid='SiteHeader'] {
          display: none !important;
        }
        div[id='spSiteHeader'] {
          display: none !important;
        }
 
        /* Hide left-hand quick launch / navigation */
        div[id='spLeftNav'] {
          display: none !important;
        }
 
        /* Hide modern site footer */
        div[data-automationid='SiteFooter'] {
          display: none !important;
        }
        div[id='CommentsWrapper'] {
          display: none !important;
        }
       
      `;
      document.head.appendChild(style);
    }
  };
  
  private caseStudies = [
  {
    title: "CNHI",
    thumbnail: "https://capgemini.sharepoint.com/:i:/r/sites/KnowNow/AIMarketplace/SiteAssets/SitePages/Case%20study%20first%20slides/CNHI.png?csf=1&web=1&e=KPU8J8",
    url: "https://capgemini.sharepoint.com/sites/KnowNow/_layouts/15/viewer.aspx?sourcedoc={e4cede9f-c8e8-403d-b63f-0f7a14e3ce85}"
  },
  {
    title: "Innovative Medicine",
    thumbnail: "https://capgemini.sharepoint.com/:i:/r/sites/KnowNow/AIMarketplace/SiteAssets/SitePages/Case%20study%20first%20slides/Innovative%20Medicine.png?csf=1&web=1&e=np4OCE",
    url: "https://capgemini.sharepoint.com/sites/KnowNow/_layouts/15/viewer.aspx?sourcedoc={1ba70de9-29a9-4c9a-9af1-31cdad7e5805}"
  },
  {
    title: "Disruption Management",
    thumbnail: "https://capgemini.sharepoint.com/:i:/r/sites/KnowNow/AIMarketplace/SiteAssets/SitePages/Case%20study%20first%20slides/Disruption%20Management.png?csf=1&web=1&e=ZFPddX",
    url: "https://capgemini.sharepoint.com/sites/KnowNow/_layouts/15/viewer.aspx?sourcedoc={38dc62e7-deb6-41e5-a020-a3ff607d2a36}"
  }
];
  // safe extractor for different SP field shapes
  private getFieldString = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string") return val.trim();
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    // Lookup field: { Title: "X" } or { Label: "X" }
    if (typeof val === "object" && val !== null) {
      if (Array.isArray(val)) {
        // multi-value (choices / users / lookup) - try to map Titles or values
        const parts = (val as unknown[])
          .map((v: unknown) => {
            const obj = v as Record<string, unknown>;
            if (obj?.Title !== undefined) return String(obj.Title);
            if (obj?.Label !== undefined) return String(obj.Label);
            if (typeof v === "string") return v;
            return JSON.stringify(v);
          })
          .filter(Boolean);
        return parts.join(", ");
      } else {
        const obj = val as Record<string, unknown>;
        if (obj?.Title !== undefined) return String(obj.Title);
        if (obj?.Label !== undefined) return String(obj.Label);
        // Sometimes SharePoint returns { results: [...] }
        if (obj?.results && Array.isArray(obj.results)) {
          return (obj.results as unknown[])
            .map((r: unknown) => {
              if (r && typeof r === "object") {
                const rr = r as Record<string, unknown>;
                if (rr?.Title !== undefined) return String(rr.Title);
                if (rr?.Label !== undefined) return String(rr.Label);
              }
              if (typeof r === "string") return r;
              return String(r);
            })
            .join(", ");
        }
        return JSON.stringify(obj);
      }
    }
    return String(val);
  };

  // try several candidate labels to find internal name
  private findInternalName = (
    fieldMap: { [k: string]: string },
    candidates: string[]
  ): string | undefined => {
    // 1) match by display Title (case-insensitive) and return the ORIGINAL internal name (key)
    for (const cand of candidates) {
      const lowerCand = cand.toString().toLowerCase();
      for (const k of Object.keys(fieldMap)) {
        const title = (fieldMap[k] || "").toString().toLowerCase();
        if (title === lowerCand) return k; // return original internal name
      }
    }
    // 2) if candidate is already an internal name (case-insensitive), return the matching original key
    for (const cand of candidates) {
      const lowerCand = cand.toString().toLowerCase();
      for (const k of Object.keys(fieldMap)) {
        if (k.toLowerCase() === lowerCand) return k;
      }
    }
    return undefined;
  };

  public async componentDidMount(): Promise<void> {
    window.addEventListener("keydown", this.handleKeyDown);
    this.hideChrome();
    await this.loadList("Starter Pack");
  }
  
private async fetchAllItems(listTitle: string): Promise<ITileItem[]> {
  let allItems: ITileItem[] = [];
  let batch: ITileItem[] = [];
  let skip = 0;
  const pageSize = 500;

  do {
    batch = await _sp.web.lists
      .getByTitle(listTitle)
      .items.select("*")
      .top(pageSize)
      .skip(skip)() as ITileItem[];

    allItems = allItems.concat(batch);
    skip += pageSize;
  } while (batch.length === pageSize);

  return allItems;
}

private loadList = async (listKey: "Starter Pack" | "Agents"): Promise<void> => {
  this.setState({
    loading: true,
    searchQuery: "",
  });

  const listTitle =
    listKey === "Agents"
      ? "Operational Excellence Agents"
      : "Industrialized Use cases";

  try {
    const [items, fields] = await Promise.all([
      this.fetchAllItems(listTitle), // ✅ Fetch ALL items
      _sp.web.lists
        .getByTitle(listTitle)
        .fields.filter("Hidden eq false and ReadOnlyField eq false")
        .select("InternalName", "Title", "TypeAsString")(),
    ]);

    const fieldMap: { [key: string]: string } = {};
    fields.forEach((field: { InternalName: string; Title: string }) => {
      fieldMap[field.InternalName] = field.Title;
    });

      // Also fetch all fields (including read-only/hidden) to detect rating count internal name
      let fullFieldMap: { [key: string]: string } = {};
      let detectedUrlFields: string[] = [];
      try {
        const allFields = await _sp.web.lists.getByTitle(listTitle).fields.select("InternalName", "Title", "ReadOnlyField", "Hidden", "TypeAsString")();
        (allFields || []).forEach((f: any) => {
          fullFieldMap[f.InternalName] = f.Title;
        });

        // Detect URL/Hyperlink fields by TypeAsString or internal name patterns
        detectedUrlFields = (allFields || []).filter((f: any) => {
          const type = (f.TypeAsString || '').toString().toLowerCase();
          const internal = (f.InternalName || '').toString().toLowerCase();
          const title = (f.Title || '').toString().toLowerCase();
          // Common TypeAsString for hyperlink/url fields may include 'url' or 'hyperlink'
          if (type.indexOf('url') !== -1 || type.indexOf('hyperlink') !== -1) return true;
          // fallback: internal name contains url/link
          if (internal.indexOf('url') !== -1 || internal.indexOf('link') !== -1 || internal.indexOf('hyperlink') !== -1) return true;
          // display title contains 'link' or 'url'
          if (title.indexOf('link') !== -1 || title.indexOf('url') !== -1) return true;
          return false;
        }).map((f: any) => f.InternalName as string);
      } catch (e) {
        console.warn('Could not fetch all fields for detection', e);
        fullFieldMap = { ...fieldMap };
        detectedUrlFields = [];
      }

      // debug - helps you inspect what internal names exist
      console.debug("Loaded fields for", listTitle, fieldMap);
      console.debug("Full field map (including read-only/hidden):", fullFieldMap);

      if (listKey === "Agents") {
        // try multiple candidate display names/internal names
        this.agentsGroupField = this.findInternalName(fieldMap, [
          // "Business line",
          // "Business Line",
          // "businessline",
          // "business_line",
          "industry",
          "Industry",
          "field_3",
        ]);
        this.agentsTileField = this.findInternalName(fieldMap, [
          "Brief description",
          "Brief Description",
          "brief_description",
          "field_4",
        ]);
        // set current pointers
        this.currentGroupField = this.agentsGroupField;
        this.currentTileField = this.agentsTileField;
      } else {
        // Starter pack: prefer industry for grouping and use_case (or Title fallback)
        this.starterGroupField = this.findInternalName(fieldMap, [
          "Industry",
          "industry",
          //"BusinessLine",
          // "businessline",
          // "Business_x0020_Line",
          // "business_line",
          "field_?",
        ]);
        this.starterTileField = this.findInternalName(fieldMap, [
          "Solution Summary",
          "Solution_Summary",
          "Solution_x0020_Summary",
          "solution_summary",
          "solution summary",
          "solution",
          "Summary",
        ]);
        this.currentGroupField = this.starterGroupField;
        this.currentTileField = this.starterTileField;
      }

      // Detect rating fields (try several common display names)
      // Prefer fullFieldMap (includes read-only fields) so we can detect hidden/count fields
      this.ratingAvgField = this.findInternalName(fullFieldMap, [
        "Rating (0-5)",
        "Rating",
        "Rating0-5",
        "Rating_x0020__x0028_0-5_x0029_",
      ]);
      this.ratingCountField = this.findInternalName(fullFieldMap, [
        "Number of Ratings",
        "NumberOfRatings",
        "RatingsCount",
        "Number_x0020_of_x0020_Ratings",
      ]);
      console.debug("Detected rating fields:", this.ratingAvgField, this.ratingCountField);

      // If group field not found, for Starter Pack we will fall back to Title grouping (so no mix)
      if (!this.currentGroupField && listKey === "Starter Pack") {
        console.debug(
          "Group field not found for Starter Pack — falling back to Title grouping"
        );
      }
      // If tile field not found, leave undefined (will show blank)

      // Filter items to show only those with an "Agentic link" value when that field exists
      let filteredItems = items;

      // Try to locate the internal name for Agentic link using a few likely display/internal names
      const agenticLinkInternalName = this.findInternalName(fieldMap, [
        "Agentic link",
        "Agentic Link",
        "AgenticLink",
        "agentic link",
        "agenticlink",
        "Agentic_x0020_link",
        "Agentic_Link",
        "Agentic_x0020_Link"
      ]);

      if (agenticLinkInternalName) {
        filteredItems = items.filter((item) => {
          const rawVal = (item as any)[agenticLinkInternalName];
          // Prefer the URL extractor which handles link field shapes; fallback to non-empty checks
          const url = this.extractUrlFromValue(rawVal);
          if (url && String(url).trim() !== "") return true;
          if (rawVal === null || rawVal === undefined) return false;
          if (typeof rawVal === "string") return rawVal.trim() !== "";
          if (typeof rawVal === "object") return Object.keys(rawVal).length > 0;
          return false;
        });
        console.debug(`Filtered ${listKey}: ${items.length} total, ${filteredItems.length} with Agentic link`);
      } else {
        console.debug('No "Agentic link" field found for', listTitle);
      }

      this.setState({ items: filteredItems, fieldMap, loading: false, activeList: listKey, urlFields: detectedUrlFields }, this.groupItems);
  } catch (error) {
    console.error(error);
    this.setState({ loading: false });
  }
};


  public componentWillUnmount(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      this.closeModal();
    }
  };
  private handleToggleAll = (): void => {
    this.setState(
      (
        prevState
      ): Pick<
        IListDataWebPartState,
        "collapsedSections" | "toggleClickCount" | "toggleButtonText"
      > => {
        const { groupedItems, toggleClickCount } = prevState;
        const newCollapsedSections: { [key: string]: boolean } = {};
        const groupKeys = Object.keys(groupedItems);

        let newText = "Expand All";

        switch (toggleClickCount % 3) {
          case 0:
            // First click: first expanded, rest expanded
            groupKeys.forEach((key) => {
              newCollapsedSections[key] = false;
            });
            newText = "Collapse All";
            break;
          case 1:
            // Second click: collapse all sections (including the first)
            groupKeys.forEach((key) => {
              newCollapsedSections[key] = true;
            });
            newText = "Expand All";
            break;
          case 2:
            // Third click: all expanded
            groupKeys.forEach((key) => {
              newCollapsedSections[key] = false;
            });
            newText = "Collapse All";
            break;
        }

        return {
          collapsedSections: newCollapsedSections,
          toggleClickCount: toggleClickCount + 1,
          toggleButtonText: newText,
        };
      }
    );
  };

  private groupItems = (): void => {
    const { items, searchQuery, activeList } = this.state;
    const groupedItems: { [key: string]: ITileItem[] } = {};
    const query = (searchQuery || "").toLowerCase();

    const filteredItems = items.filter((item) => {
      // build a combined searchable string for the entire item (all fields + field display names)
      const combined = Object.entries(item)
        .map(([key, val]: [string, unknown]) => {
          const label = this.state.fieldMap && this.state.fieldMap[key] ? this.state.fieldMap[key] : key;
          return `${label} ${this.getFieldString(val)}`;
        })
        .join(" ")
        .toLowerCase();

      // previous logic kept for group/title detection:
      const title = this.getFieldString(item.Title).toLowerCase();
      const rawGroup = this.currentGroupField ? item[this.currentGroupField] : undefined;
      const groupString =
        this.getFieldString(rawGroup).toLowerCase() ||
        (activeList === "Starter Pack" ? title : "");

      // match if query is present in any field, label, title, or group
      return (
        (!query) ||
        combined.includes(query) ||
        title.includes(query) ||
        groupString.includes(query)
      );
    });

    filteredItems.forEach((item) => {
      const rawGroup = this.currentGroupField ? item[this.currentGroupField] : undefined;

      let key = this.getFieldString(rawGroup);
      // if no key and Starter Pack fallback to Title (so Title shows as section header)
      if (!key && this.state.activeList === "Starter Pack") {
        key = this.getFieldString(item.Title) || "Other";
      }
      if (!key) key = "Other";
      if (!groupedItems[key]) groupedItems[key] = [];
      groupedItems[key].push(item);
    });

    // const collapsedSections: { [key: string]: boolean } = {};
    // Object.keys(groupedItems).forEach((k, i) => {
    //   collapsedSections[k] = i !== 0;
    // });

    //.....1st section will get opened.....//
    // const collapsedSections: { [key: string]: boolean } = {};
    // const sortedKeys = Object.keys(groupedItems).sort((a, b) => a.localeCompare(b));
    // sortedKeys.forEach((k, i) => {
    //   collapsedSections[k] = i !== 0; // First sorted section expanded
    // });

    // Sort section keys alphabetically so the first visible section is predictable
    const sortedKeys = Object.keys(groupedItems).sort((a, b) => a.localeCompare(b));

    // Rebuild groupedItems in sorted order to preserve display ordering
    const newGrouped: { [key: string]: ITileItem[] } = {};
    sortedKeys.forEach((k) => {
      newGrouped[k] = groupedItems[k];
    });
    // Preserve any existing user-expanded/collapsed state where possible.
    const prevCollapsed = (this.state && this.state.collapsedSections) ? this.state.collapsedSections : {};
    const collapsedSections: { [key: string]: boolean } = {};
    sortedKeys.forEach((k, i) => {
      // If a search query is present, expand all sections that contain matched items
      if (query && query.length > 0) {
        collapsedSections[k] = false;
        return;
      }
      // If the user previously interacted and we have a value for this key, preserve it
      if (Object.prototype.hasOwnProperty.call(prevCollapsed, k)) {
        collapsedSections[k] = prevCollapsed[k];
        return;
      }
      // Otherwise, default to first section expanded for Starter Pack (or any list)
      collapsedSections[k] = i !== 0;
    });

    this.setState({ groupedItems: newGrouped, collapsedSections });
  };

  // Fetch comments for a specific list item using PnPJS if available, otherwise REST GetComments()
  private fetchComments = async (listTitle: string, itemId: number): Promise<void> => {
    try {
      // reset debug/error
      this.setState({ commentError: "", rawCommentsPayload: undefined });

      // attempt with primary site URL
      const tryFetch = async (siteUrl: string) => {
        const url = `${siteUrl}/_api/web/lists/getByTitle('${encodeURIComponent(listTitle)}')/items(${itemId})/GetComments()`;
        console.debug("Fetching comments from:", url);
        const res = await fetch(url, {
          credentials: "same-origin",
          headers: { Accept: "application/json;odata=verbose" },
        });
        return { res, url };
      };

      const siteUrl = this.getSiteUrl();
      let attempt = await tryFetch(siteUrl);
      let res = attempt.res;
      let url = attempt.url;

      // if list not found error, try alternate derived from path
      if (!res.ok) {
        const bodyText = await res.text().catch(() => "");
        console.warn("Initial GetComments failed:", res.status, bodyText);
        // set raw payload to help debugging
        this.setState({ rawCommentsPayload: bodyText });
        // check for 'List ... does not exist at site with URL'
        if (bodyText && bodyText.indexOf("does not exist at site with URL") !== -1) {
          const altSite = this.deriveAltSiteFromPath();
          if (altSite && altSite !== siteUrl) {
            console.debug("Retrying GetComments using alternate site URL:", altSite);
            attempt = await tryFetch(altSite);
            res = attempt.res;
            url = attempt.url;
          }
        }
      }

      console.debug("GetComments final response status:", res.status, res.statusText, "url used:", url);
      if (!res.ok) {
        const textBody = await res.text().catch(() => "");
        console.warn("Failed to fetch comments (final). Status, body:", res.status, textBody);
        this.setState((s) => ({ commentsByItem: { ...s.commentsByItem, [itemId]: [] }, rawCommentsPayload: textBody }));
        return;
      }

      const data = await res.json();
      console.debug("GetComments raw JSON:", data);
      this.setState({ rawCommentsPayload: data });

      // Extract comment array from common shapes
      let commentsRaw: any[] = [];
      if (Array.isArray(data.d?.results)) commentsRaw = data.d.results;
      else if (Array.isArray(data.d?.GetComments?.results)) commentsRaw = data.d.GetComments.results;
      else if (Array.isArray(data.d?.Comments)) commentsRaw = data.d.Comments;
      else if (Array.isArray(data.value)) commentsRaw = data.value;
      else if (Array.isArray((data as any).Comments)) commentsRaw = (data as any).Comments;
      else if (Array.isArray((data as any).GetComments)) commentsRaw = (data as any).GetComments;
      else if (Array.isArray(data)) commentsRaw = data;
      else if (data && typeof data === "object") {
        const maybe = data.d?.GetComments || data.d?.Comments || data.GetComments || data.Comments;
        if (Array.isArray(maybe)) commentsRaw = maybe;
      }

      if (!commentsRaw || commentsRaw.length === 0) {
        console.debug("No comments array found — full payload logged above.");
      }

      const normalized = (commentsRaw || []).map((c: any) => {
        const text =
          c.Text ||
          c.text ||
          c.Comment ||
          c.comment ||
          c.Content ||
          c.Message ||
          (c.CommentText && c.CommentText.Text) ||
          (c.Comment && c.Comment.Text) ||
          c.textRaw ||
          "";

        // IMPROVED author extraction: handle the shape you pasted where author is lower-case 'author'
        const author =
          // server shapes: lower-case "author" with .name / .email / .loginName
          c.author?.name ||
          c.author?.email ||
          c.author?.loginName ||
          // older shapes / nested user objects
          c.Author?.Title ||
          c.Author?.DisplayName ||
          c.CreatedBy?.Title ||
          c.CreatedBy?.DisplayName ||
          c.CreatedByUser?.Title ||
          c.CreatedByUser?.DisplayName ||
          c.User?.Title ||
          c.User?.DisplayName ||
          c.createdBy?.title ||
          c.createdBy?.name ||
          c.author?.displayName ||
          c.AuthorName ||
          c.employee ||
          c.Employee ||
          "";

        const created =
          c.createdDate || // the JSON you pasted uses createdDate
          c.Created ||
          c.created ||
          c.CreatedDate ||
          c.Timestamp ||
          c.CreatedAt ||
          c.TimeStamp ||
          c.CreatedOn ||
          "";

        return {
          text: String(text || "").trim(),
          author: String(author || "").trim() || "Unknown",
          created: String(created || "").trim(),
        };
      });

      this.setState((prev) => ({
        commentsByItem: { ...prev.commentsByItem, [itemId]: normalized },
      }));
    } catch (err) {
      console.error("Error fetching comments (final):", err);
      this.setState((s) => ({ commentsByItem: { ...s.commentsByItem, [itemId]: [] }, commentError: String(err) }));
    }
  };

  // Post a comment using PnPJS .comments.add if available, otherwise fallback to REST Comments/add
  private postComment = async (listTitle: string, itemId: number, text: string): Promise<void> => {
    if (!text || text.trim().length === 0) return;
    this.setState({ commentPosting: true, commentError: "" });
    try {
      // first attempt (pnP or REST) uses primary site url
      const siteUrl = this.getSiteUrl();
      const tryPost = async (postUrl: string) => {
        const digest = await this.getRequestDigest();
        const res = await fetch(postUrl, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            Accept: "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            ...(digest ? { "X-RequestDigest": digest } : {}),
          },
          body: JSON.stringify({ text }),
        });
        return res;
      };

      // prefer PnPJS add if available (unchanged)
      try {
        const pnp = (_sp as any);
        if (pnp && pnp.web && typeof pnp.web.lists === "function") {
          try {
            console.debug("Attempting PnPJS comments.add for", listTitle, itemId);
            const addResult = await pnp.web.lists.getByTitle(listTitle).items.getById(itemId).comments.add(text);
            if (addResult) {
              await this.fetchComments(listTitle, itemId);
              this.setState({ commentInput: "" });
              return;
            }
          } catch (e) {
            console.warn("PnPJS post failed:", e);
            this.setState({ commentError: this.mapAccessError(String(e)) });
          }
        }
      } catch (e) {
        console.warn("PnPJS check failed:", e);
      }

      // REST endpoints to try
      const endpoints = [
        `${siteUrl}/_api/web/lists/getByTitle('${encodeURIComponent(listTitle)}')/items(${itemId})/Comments/add`,
        `${siteUrl}/_api/web/lists/getByTitle('${encodeURIComponent(listTitle)}')/items(${itemId})/SetComment`,
      ];

      let posted = false;
      let lastError: string | undefined = undefined;

      for (const endpoint of endpoints) {
        try {
          const res = await tryPost(endpoint);
          console.debug("POST attempt:", endpoint, res.status, res.statusText);
          if (res.ok) {
            posted = true;
            break;
          } else {
            const body = await res.text().catch(() => "");
            lastError = `Status ${res.status}: ${body}`;
            console.warn("POST failed:", endpoint, lastError);
          }
        } catch (e) {
          lastError = String(e);
          console.warn("POST attempt threw:", endpoint, e);
        }
      }

      // if not posted and error indicates wrong site, try alternate site
      if (!posted && lastError && lastError.indexOf("does not exist at site with URL") !== -1) {
        const altSite = this.deriveAltSiteFromPath();
        if (altSite && altSite !== siteUrl) {
          console.debug("Retrying POST using alternate site:", altSite);
          const altEndpoints = [
            `${altSite}/_api/web/lists/getByTitle('${encodeURIComponent(listTitle)}')/items(${itemId})/Comments/add`,
            `${altSite}/_api/web/lists/getByTitle('${encodeURIComponent(listTitle)}')/items(${itemId})/SetComment`,
          ];
          for (const endpoint of altEndpoints) {
            try {
              const res = await tryPost(endpoint);
              console.debug("Alt POST attempt:", endpoint, res.status, res.statusText);
              if (res.ok) {
                posted = true;
                break;
              } else {
                const body = await res.text().catch(() => "");
                lastError = `Status ${res.status}: ${body}`;
                console.warn("Alt POST failed:", endpoint, lastError);
              }
            } catch (e) {
              lastError = String(e);
            }
          }
        }
      }

      if (!posted) {
        // translate low‑level errors into something friendlier for end users
        let errMsg = lastError || "All POST endpoints failed";
        // common patterns when the user lacks list permissions or the list/url is wrong
        if (/404/.test(errMsg) || /Cannot find resource/.test(errMsg) || /does not exist at site/.test(errMsg) || /access denied/i.test(errMsg) || /403/.test(errMsg)) {
          errMsg = "Comments are temporarily unavailable. Please try again later.";
        }
        this.setState({ commentError: errMsg });
        throw new Error(errMsg);
      }

      // success — refresh
      this.setState({ commentInput: "" });
      await this.fetchComments(listTitle, itemId);
    } catch (err) {
      console.error("Error posting comment (final):", err);
      if (!this.state.commentError) {
        let msg = String(err);
        if (/404/.test(msg) || /Cannot find resource/.test(msg) || /does not exist at site/.test(msg) || /access denied/i.test(msg) || /403/.test(msg)) {
          msg = "Comments are temporarily unavailable. Please try again later.";
        }
        this.setState({ commentError: msg });
      }
    } finally {
      this.setState({ commentPosting: false });
    }
  };

  // openModal — fetch comments after opening
  private openModal = (item: ITileItem): void => {
    // ...existing code...
    this.setState({ selectedItem: item, showModal: true, modalTab: 'overview' }, async (): Promise<void> => {
      this.modalContentRef.current?.focus();
      // determine list title for activeList
      const listTitle =
        this.state.activeList === "Agents"
          ? "Operational Excellence Agents"
          : "Industrialized Use cases";
      if (item && item.Id !== undefined) {
        await this.fetchComments(listTitle, item.Id);
        // Try to obtain the current user's rating for this item from server (if exposed) and update local cache/UI
        try {
          const userRating = await this.tryGetUserRatingForItem(listTitle, Number(item.Id));
          if (userRating !== undefined) {
            try { this.setLocalRatingForItem(listTitle, Number(item.Id), userRating); } catch (e) { /* ignore */ }
            // update selectedItem so stars reflect server-provided user rating
            this.setState((prev) => ({ selectedItem: prev.selectedItem && prev.selectedItem.Id === item.Id ? { ...prev.selectedItem, ...(this.ratingAvgField ? { [this.ratingAvgField]: prev.selectedItem![this.ratingAvgField!] } : {}) } : prev.selectedItem }));
            // Force re-render of modal stars by nudging selectedItem (the actual star rendering reads local cache)
            this.setState((s) => ({ selectedItem: s.selectedItem }));
          }
        } catch (e) {
          console.debug('Could not read per-user rating from server', e);
        }
      }
    });
  };
//   private closeModal = (): void => {
//   const { selectedItem, groupedItems } = this.state;
//   let groupKeyToOpen: string | undefined;
//   // Find the group key for the selected item
//   if (selectedItem && groupedItems) {
//     for (const [groupKey, items] of Object.entries(groupedItems)) {
//       if (items.some(item => item.Id === selectedItem.Id)) {
//         groupKeyToOpen = groupKey;
//         break;
//       }
//     }
//   }
//   // Expand the relevant section if found
//   if (groupKeyToOpen) {
//     this.setState(prevState => ({
//       showModal: false,
//       selectedItem: undefined,
//       collapsedSections: { ...prevState.collapsedSections, [groupKeyToOpen as string]: false }
//     }), () => {
//       // After state update, scroll to the section header for the opened group
//       const sectionHeader = document.querySelector(`[data-group-key="${groupKeyToOpen}"]`);
//       if (sectionHeader) {
//         sectionHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
//       }
//     });
//   } else {
//     this.setState({ showModal: false, selectedItem: undefined });
//   }
// };
private closeModal = (): void => {
  const { selectedItem, groupedItems } = this.state;
  let groupKeyToOpen: string | undefined;
  if (selectedItem && groupedItems) {
    for (const [groupKey, items] of Object.entries(groupedItems) as [string, ITileItem[]][]) {
      if (items.some((item: ITileItem) => item.Id === selectedItem.Id)) {
        groupKeyToOpen = groupKey;
        break;
      }
    }
  }
  if (groupKeyToOpen) {
    this.setState(prevState => {
      // Close all sections except the one to open
      const newCollapsedSections: { [key: string]: boolean } = {};
      Object.keys(prevState.collapsedSections).forEach(key => {
        newCollapsedSections[key] = key !== groupKeyToOpen;
      });
      return {
        showModal: false,
        selectedItem: undefined,
        collapsedSections: newCollapsedSections,
        commentInput: ""
      };
    }, () => {
      // Scroll the centerPanel container so the section header is visible
      const sectionHeader = document.querySelector(`[data-group-key="${groupKeyToOpen}"]`) as HTMLElement | null;
      const centerPanel = document.querySelector(`.${styles.centerPanel}`) as HTMLElement | null;
      const STICKY_OFFSET = 80; // matches top spacing for sticky header
      if (sectionHeader && centerPanel && centerPanel.contains(sectionHeader)) {
        const headerTop = sectionHeader.offsetTop;
        centerPanel.scrollTo({ top: Math.max(0, headerTop - STICKY_OFFSET), behavior: 'smooth' });
      } else if (sectionHeader) {
        // fallback to regular scrollIntoView when container not found
        sectionHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  } else {
    this.setState({ showModal: false, selectedItem: undefined, commentInput: "" });
  }
};

  private toggleSection = (key: string): void => {
    this.setState(
      (prevState): Pick<IListDataWebPartState, "collapsedSections"> => {
        const isCurrentlyCollapsed = prevState.collapsedSections[key];
        const newCollapsedSections: { [key: string]: boolean } = {};
        Object.keys(prevState.collapsedSections).forEach(
          (sectionKey: string): void => {
            newCollapsedSections[sectionKey] = true;
          }
        );
        newCollapsedSections[key] = !isCurrentlyCollapsed;
        return { collapsedSections: newCollapsedSections };
      }
    );
  };

  private handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    this.setState({ searchQuery: event.target.value }, this.groupItems);
  };

  // Open the external form link in a new tab. Replace FORM_URL with your form link.
  private openForm = (): void => {
    const { activeList } = this.state;
    const FORM_URL =
      activeList === "Agents"
        ? "https://forms.office.com/pages/responsepage.aspx?id=Wq6idgCfa0-V7V0z13xNYXF5GbBYaclLsPxnGQ789FVUMU1ETUtFTENYQlNGWTJHU1owWDdTWUQzRS4u&route=shorturl" // agents form URL
        : "https://forms.office.com/pages/responsepage.aspx?id=Wq6idgCfa0-V7V0z13xNYXF5GbBYaclLsPxnGQ789FVUMU1ETUtFTENYQlNGWTJHU1owWDdTWUQzRS4u&route=shorturl";
    try {
      const w = window.open(FORM_URL, "_blank");
      if (w) w.opener = null;
    } catch (e) {
      // fallback: navigate in same tab if popup blocked
      window.location.href = FORM_URL;
    }
  };

  private getDisplayValue = (value: unknown): string => {
    if (
      value === null ||
      value === undefined ||
      value === false ||
      value === ""
    ) {
      return "Not Available";
    }
    return String(value);
  };
  private getTileText = (item: ITileItem): string => {
    if (this.currentTileField && item[this.currentTileField] !== undefined) {
      return this.getFieldString(item[this.currentTileField]) || "";
    }
    return "";
  };

  // Detect if a value represents a URL (returns URL string or undefined)
  private extractUrlFromValue = (val: unknown): string | undefined => {
    if (val === null || val === undefined) return undefined;
    // SharePoint link field shape: { Url: 'https...', Description: '...' }
    if (typeof val === 'object') {
      try {
        const obj = val as any;
        if (obj?.Url && typeof obj.Url === 'string' && obj.Url.trim()) return obj.Url.trim();
        // sometimes it's { url: '...' }
        if (obj?.url && typeof obj.url === 'string' && obj.url.trim()) return obj.url.trim();
        // sometimes it's an array of link-objects
        if (Array.isArray(obj)) {
          for (const el of obj) {
            const u = this.extractUrlFromValue(el);
            if (u) return u;
          }
        }
      } catch (e) {
        // fallthrough
      }
    }
    // string shaped URLs
    if (typeof val === 'string') {
      const s = val.trim();

      // Absolute URL
      if (s.startsWith('http://') || s.startsWith('https://')) {
        return s;
      }
      // Server-relative SharePoint URL
      if (s.startsWith('/')) {
        return `${window.location.origin}${s}`;
      }
      // Relative SharePoint page URL
      if (
        s.startsWith('SitePages/') ||
        s.includes('.aspx')
      ) {
        return `${this.getSiteUrl()}/${s.replace(/^\/+/, '')}`;
      }
      // sometimes stored as JSON encoded string
      try {
        const parsed = JSON.parse(s);
        return this.extractUrlFromValue(parsed);
      } catch (e) {
        // ignore
      }
      // try to find any http(s) URL inside plain text (e.g., multi-line note with a pasted link)
      try {
        // match until whitespace (simple, robust capture)
        const m = s.match(/https?:\/\/[^\s]+/i);
        if (m && m[0]) {
          // trim common trailing punctuation characters without using complex escaped regex
          let u = m[0];
          while (u.length > 0) {
            const last = u.charAt(u.length - 1);
            if ([")", "]", ".", ",", ";", ":", "'", '"', "\\"].includes(last)) {
              u = u.slice(0, -1);
            } else {
              break;
            }
          }
          return u;
        }
      } catch (e) {
        // ignore
      }
    }
    return undefined;
  };

  // Extract filename (or short label) from a URL. Falls back to hostname when no path.
  private getFilenameFromUrl = (url: string | undefined): string | undefined => {
    if (!url || typeof url !== 'string') return undefined;
    try {
      // remove query and fragment
      const clean = url.split('#')[0].split('?')[0];
      const u = new URL(clean, window.location.origin);
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length === 0) return u.hostname;
      const last = parts[parts.length - 1];
      // decode and prefer a readable filename
      const decoded = decodeURIComponent(last.replace(/\+/g, ' '));
      return decoded || u.hostname;
    } catch (e) {
      // fallback: try a crude parse
      const m = (url || '').match(/https?:\/\/(?:www\.)?([^/]+)\/(.*)/i);
      if (m && m[2]) {
        const parts = m[2].split('/').filter(Boolean);
        return parts.length ? decodeURIComponent(parts[parts.length - 1]) : m[1];
      }
      return undefined;
    }
  };

  // Return list of link-like fields for an item: { key, label, url }
  private getLinkFieldsForItem = (item: ITileItem): { key: string; label: string; displayText: string; url: string | undefined }[] => {
    const out: { key: string; label: string; displayText: string; url: string | undefined }[] = [];
    if (!item) return out;
    const urlFieldNames = (this.state && Array.isArray(this.state.urlFields)) ? this.state.urlFields : [];
    Object.keys(item).forEach((k) => { 
      const label = this.state.fieldMap && this.state.fieldMap[k] ? this.state.fieldMap[k] : k;
      const labelLower = (label || '').toString().trim().toLowerCase();
      const v = item[k];
      // Do not treat "Sample Input File" as a top link icon field; display it at bottom instead
      if (labelLower === 'sample input file') return;
      // prefer explicit link-like fields detected by schema
      let url = undefined as string | undefined;
      if (urlFieldNames && urlFieldNames.includes(k)) {
        url = this.extractUrlFromValue(v);
        const display = label;
        out.push({ key: k, label, displayText: display, url });
        return;
      }

      // otherwise, attempt to detect an inline URL inside textual fields
      url = this.extractUrlFromValue(v);
      if (url) {
        const filename = this.getFilenameFromUrl(url);
        const display = filename || label;
        out.push({ key: k, label, displayText: display, url });
        return;
      }
    });
    return out;
  };

  // Render a distinct SVG icon per field label (falls back to generic link/file)
  private renderIconForField = (label: string, hasUrl: boolean): React.ReactNode => {
    const S = (styles as any);
    const l = (label || '').toString().toLowerCase();
    // choose icon type by label keywords
    const isGithub = /github|repo|repository|git/i.test(l);
    const isVideo = /video|demo|mp4|mov|youtube|vimeo/i.test(l);
    const isPpt = /ppt|presentation|deck|powerpoint|slide/i.test(l);
    const isDoc = /doc|document|pdf|file|report/i.test(l);
    const isClickThrough = /click|clickthrough|click through/i.test(l);
    // new types: external site / website link, and datasheet/spreadsheet/spec
    const isExternalSite = /site|website|web|url|link to site|external/i.test(l);
    const isSheet = /sheet|datasheet|spec|specs|spreadsheet|xls|xlsx|csv/i.test(l);

    const commonSvgProps = { viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' } as any;

    // helper to wrap an inline svg inside the circular container
    const wrap = (svg: React.ReactNode) => (
      <span className={`${S.iconCircle} ${hasUrl ? S.linkIconBlue : S.linkIconGrey}`} aria-hidden="true">
        {svg}
      </span>
    );

    if (isGithub) {
      return wrap(
        <svg {...commonSvgProps} role="img" aria-label="Repository">
          <path d="M12 .5C5.73.5.75 5.48.75 11.74c0 4.93 3.19 9.11 7.61 10.58.56.1.76-.24.76-.53 0-.26-.01-.95-.01-1.86-3.09.67-3.75-1.49-3.75-1.49-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.72 1.16 1.72 1.16 1.0 1.73 2.62 1.23 3.26.94.1-.73.39-1.23.71-1.52-2.47-.28-5.07-1.24-5.07-5.52 0-1.22.44-2.22 1.16-3-.12-.28-.5-1.4.11-2.92 0 0 .95-.3 3.12 1.15a10.8 10.8 0 0 1 2.84-.38c.96 0 1.92.13 2.84.38 2.17-1.45 3.12-1.15 3.12-1.15.61 1.52.23 2.64.12 2.92.72.78 1.16 1.78 1.16 3 0 4.29-2.61 5.24-5.09 5.51.4.35.75 1.03.75 2.07 0 1.49-.01 2.69-.01 3.06 0 .29.2.64.77.53C20.06 20.85 23.25 16.67 23.25 11.74 23.25 5.48 18.27.5 12 .5z" fill="#fff"/>
        </svg>
      );
    }
    if (isVideo) {
      return wrap(
        <svg {...commonSvgProps} role="img" aria-label="Video">
          <path d="M3 6.5C3 5.12 4.12 4 5.5 4h13c1.38 0 2.5 1.12 2.5 2.5v9c0 1.38-1.12 2.5-2.5 2.5h-13C4.12 18 3 16.88 3 15.5v-9zM9 9v6l5-3-5-3z" fill="#fff"/>
        </svg>
      );
    }
    if (isPpt) {
      return wrap(
        <svg {...commonSvgProps} role="img" aria-label="Presentation">
          <path d="M3 4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18V4H3zm5 3h10v2H8V7zm0 4h10v2H8v-2z" fill="#fff"/>
        </svg>
      );
    }
    if (isDoc) {
      return wrap(
        <svg {...commonSvgProps} role="img" aria-label="Document">
          <path d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM13 3.5V9h5.5" fill="#fff"/>
        </svg>
      );
    }
    if (isClickThrough) {
      return wrap(
        <svg {...commonSvgProps} role="img" aria-label="Click Through">
          <path d="M3 12a9 9 0 1 1 9 9 9 9 0 0 1-9-9zm10.5-1.5h-6v3h6v-3z" fill="#fff"/>
        </svg>
      );
    }
    if (isExternalSite) {
      // globe icon
      return wrap(
        <svg {...commonSvgProps} role="img" aria-label="Website">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm5 11h-3.1a15.9 15.9 0 0 1-.9 4.1A8 8 0 0 0 17 13zM7 13a8 8 0 0 0 3.1 4.1c-.4-1.3-.7-2.7-.9-4.1H7zM12 4a15.9 15.9 0 0 1 1.8 4.6A15.9 15.9 0 0 1 12 13a15.9 15.9 0 0 1-1.8-4.4A15.9 15.9 0 0 1 12 4z" fill="#fff"/>
        </svg>
      );
    }
    if (isSheet) {
      // spreadsheet / datasheet icon
      return wrap(
        <svg {...commonSvgProps} role="img" aria-label="Datasheet">
          <path d="M3 3h14l4 4v14a2 2 0 0 1-2 2H3V3zm3 3v12h10V8H6zm2 2h3v3H8V10zm5 0h3v3h-3V10z" fill="#fff"/>
        </svg>
      );
    }

    // default link icon
    return wrap(
      <svg {...commonSvgProps} role="img" aria-label="Link">
        <path d="M3.9 12.5a4 4 0 0 1 0-5.7l2-2a4 4 0 0 1 5.7 5.7L10 12.2" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20.1 11.5a4 4 0 0 1 0 5.7l-2 2a4 4 0 0 1-5.7-5.7L14 11.8" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  // Rating helpers
  private getRatingValues = (item: ITileItem): { avg: number; count: number } => {
    const avg = this.ratingAvgField && item[this.ratingAvgField] !== undefined ? Number(item[this.ratingAvgField]) : NaN;
    const count = this.ratingCountField && item[this.ratingCountField] !== undefined ? Number(item[this.ratingCountField]) : NaN;
    return { avg: isNaN(avg) ? 0 : avg, count: isNaN(count) ? 0 : count };
  };

  private computeNewAverage = (oldAvg: number, oldCount: number, value: number): { newAvg: number; newCount: number } => {
    const prevCount = Number(oldCount) || 0;
    const prevAvg = Number(oldAvg) || 0;
    const newCount = prevCount + 1;
    const newAvg = newCount === 0 ? value : (prevAvg * prevCount + value) / newCount;
    // round to one decimal to match stored format (optional)
    return { newAvg: Math.round(newAvg * 10) / 10, newCount };
  };

  // Return user id when available. Try spPageContextInfo, fallback to a generated id stored in localStorage.
private getCurrentUserId = (): string => {
  try {
    // 1. Try SPFx context prop (most reliable in SharePoint webparts)
    if (this.props && (this.props as any).context) {
      const ctx = (this.props as any).context;
      // pageContext.user.loginName is always available in SPFx
      if (ctx.pageContext && ctx.pageContext.user) {
        const user = ctx.pageContext.user;
        if (user.loginName) return String(user.loginName);
        if (user.email) return String(user.email);
        if (user.displayName) return String(user.displayName);
      }
    }
  } catch (e) {
    // ignore
  }
  try {
    // 2. Try _spPageContextInfo (classic SharePoint pages)
    const spctx = (window as any)._spPageContextInfo;
    if (spctx && (spctx.userId || spctx.userId === 0)) return `u_${spctx.userId}`;
    if (spctx && spctx.userLoginName) return `ln_${String(spctx.userLoginName)}`;
  } catch (e) {
    // ignore
  }
  // 3. Fallback: stable browser id
  let id = localStorage.getItem('kn_local_userid');
  if (!id) {
    id = `local_${Math.random().toString(36).substring(2, 10)}`;
    try { localStorage.setItem('kn_local_userid', id); } catch (e) { /* ignore */ }
  }
  return id;
};

  // Local per-user rating store (localStorage). Keyed by site + list + item.
  private getLocalRatingKey = (listTitle: string, itemId: number): string => {
    const site = this.getSiteUrl();
    const uid = this.getCurrentUserId();
    return `kn_rating:${site}:${listTitle}:${itemId}:${uid}`;
  };

  private getLocalRatingForItem = (listTitle: string, itemId: number): number | undefined => {
    try {
      const k = this.getLocalRatingKey(listTitle, itemId);
      const v = localStorage.getItem(k);
      if (!v) return undefined;
      const n = Number(v);
      return isNaN(n) ? undefined : n;
    } catch (e) {
      return undefined;
    }
  };

  private setLocalRatingForItem = (listTitle: string, itemId: number, value: number): void => {
    try {
      const k = this.getLocalRatingKey(listTitle, itemId);
      localStorage.setItem(k, String(value));
    } catch (e) {
      // ignore storage errors
    }
  };

  // Compute new average considering that the current user may already have rated the item.
  // If prevUserRating is provided (number), it updates the average without changing the count.
  // If prevUserRating is undefined, it's treated as a new rating and count increments by 1.
  private computeNewAverageConsideringUser = (
    oldAvg: number,
    oldCount: number,
    newValue: number,
    prevUserRating?: number
  ): { newAvg: number; newCount: number } => {
    const prevCount = Number(oldCount) || 0;
    const prevAvg = Number(oldAvg) || 0;
    if (prevUserRating !== undefined && !isNaN(prevUserRating)) {
      // update existing user's rating: keep count the same
      const total = prevAvg * prevCount;
      const adjustedTotal = total - Number(prevUserRating) + Number(newValue);
      const newAvg = prevCount === 0 ? newValue : adjustedTotal / prevCount;
      return { newAvg: Math.round(newAvg * 10) / 10, newCount: prevCount };
    }
    // new rater
    return this.computeNewAverage(oldAvg, oldCount, newValue);
  };

  private updateRatingInSharePoint = async (listTitle: string, itemId: number, payload: { [k: string]: any }): Promise<void> => {
    try {
      // prefer PnPJS if available
      const pnp = (_sp as any);
      if (pnp && pnp.web && typeof pnp.web.lists === "function") {
        await pnp.web.lists.getByTitle(listTitle).items.getById(itemId).update(payload);
        return;
      }

      // fallback to REST MERGE
      const digest = await this.getRequestDigest();
      const siteUrl = this.getSiteUrl();
      const url = `${siteUrl}/_api/web/lists/getByTitle('${encodeURIComponent(listTitle)}')/items(${itemId})`;
      const res = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json;odata=verbose",
          "Content-Type": "application/json;odata=verbose",
          "X-HTTP-Method": "MERGE",
          "If-Match": "*",
          ...(digest ? { "X-RequestDigest": digest } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Failed to update rating: ${res.status} ${txt}`);
      }
    } catch (err) {
      console.error("updateRatingInSharePoint error:", err);
      throw err;
    }
  };

  // Helper: get ListItemEntityTypeFullName for proper __metadata.type when doing MERGE
  private getListItemEntityTypeFullName = async (listTitle: string): Promise<string | undefined> => {
    try {
      const siteUrl = this.getSiteUrl();
      const url = `${siteUrl}/_api/web/lists/GetByTitle('${encodeURIComponent(listTitle)}')?$select=ListItemEntityTypeFullName`;
      const res = await fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json;odata=nometadata' } });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.warn('Could not fetch ListItemEntityTypeFullName', res.status, txt);
        return undefined;
      }
      const json = await res.json();
      return json?.ListItemEntityTypeFullName;
    } catch (e) {
      console.warn('getListItemEntityTypeFullName failed', e);
      return undefined;
    }
  };

  // Attempt to fetch the current user's rating for a list item using several known endpoint shapes.
  // Returns the numeric rating (1-5) if found, otherwise undefined.
  private tryGetUserRatingForItem = async (listTitle: string, itemId: number): Promise<number | undefined> => {
    try {
      const siteUrl = this.getSiteUrl();
      const base = `${siteUrl}/_api/web/lists/getByTitle('${encodeURIComponent(listTitle)}')/items(${itemId})`;
      const attempts = [
        { url: `${base}/GetRating`, method: 'GET' },
        { url: `${base}/GetRating()`, method: 'GET' },
        { url: `${base}/GetUserRating`, method: 'GET' },
        { url: `${base}/GetUserRating()`, method: 'GET' },
        { url: `${base}/GetRatings`, method: 'GET' },
        { url: `${base}/GetRatings()`, method: 'GET' },
        { url: `${base}/Rating`, method: 'GET' },
        { url: `${base}/Rating()`, method: 'GET' },
      ];

      for (const a of attempts) {
        try {
          const res = await fetch(a.url, { method: a.method, credentials: 'same-origin', headers: { Accept: 'application/json;odata=verbose' } });
          if (!res.ok) continue;
          const text = await res.text().catch(() => '');
          if (!text) continue;
          // try to parse as JSON
          let parsed: any = undefined;
          try { parsed = JSON.parse(text); } catch (e) { parsed = text; }
          // common shapes: { d: { Rating: 4 } } or { Rating: 4 } or numeric directly
          const candidates: any[] = [];
          if (parsed === null || parsed === undefined) continue;
          if (typeof parsed === 'number') candidates.push(parsed);
          if (typeof parsed === 'string') {
            const n = Number(parsed.trim()); if (!isNaN(n)) candidates.push(n);
          }
          if (typeof parsed === 'object') {
            if (parsed.d && typeof parsed.d === 'object') {
              // collect numeric props under d
              Object.values(parsed.d).forEach((v: any) => { if (typeof v === 'number') candidates.push(v); if (typeof v === 'string' && !isNaN(Number(v))) candidates.push(Number(v)); });
            }
            // top-level numeric props
            Object.values(parsed).forEach((v: any) => { if (typeof v === 'number') candidates.push(v); if (typeof v === 'string' && !isNaN(Number(v))) candidates.push(Number(v)); });
          }
          // choose first sensible numeric between 1 and 5
          for (const c of candidates) {
            const num = Number(c);
            if (!isNaN(num) && num >= 1 && num <= 5) return Math.round(num);
          }
        } catch (e) {
          // ignore and try next
        }
      }
    } catch (e) {
      console.debug('tryGetUserRatingForItem failed', e);
    }
    return undefined;
  };

  // Use MERGE to update the rating property using the proper __metadata type (recommended approach)
  private updateRatingViaMerge = async (listTitle: string, itemId: number, ratingValue: number): Promise<boolean> => {
    try {
      // determine which internal name to use for rating property
      const ratingField = this.ratingAvgField || 'Rating';
      const entityType = await this.getListItemEntityTypeFullName(listTitle);
      if (!entityType) {
        this.setState({ ratingError: 'Could not determine list entity type', rawRatingPayload: undefined });
        return false;
      }

      const payload: any = {
        __metadata: { type: entityType },
      };
      // assign numeric value
      payload[ratingField] = Number(ratingValue);

      const digest = await this.getRequestDigest();
      const siteUrl = this.getSiteUrl();
      const url = `${siteUrl}/_api/web/lists/GetByTitle('${encodeURIComponent(listTitle)}')/items(${itemId})`;

      const headers: any = {
        Accept: 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
        'X-HTTP-Method': 'MERGE',
        'If-Match': '*',
      };
      if (digest) headers['X-RequestDigest'] = digest;

      const res = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok || res.status === 204) {
        // success
        this.setState({ rawRatingPayload: 'MERGE succeeded' });
        return true;
      }
      const txt = await res.text().catch(() => '');
      console.warn('MERGE rating failed', res.status, txt);
      // map to friendly message if it's an access issue
      let errMsg = `MERGE failed: ${res.status}`;
      errMsg = this.mapAccessError(errMsg + (txt ? ` ${txt}` : ''));
      this.setState({ ratingError: errMsg, rawRatingPayload: txt });
      return false;
    } catch (e) {
      console.error('updateRatingViaMerge error', e);
      this.setState({ ratingError: this.mapAccessError(String(e)) });
      return false;
    }
  };


  // Try the server-side rating endpoint (SetRating) which will apply per-user rating
  private trySetRatingEndpoint = async (listTitle: string, itemId: number, value: number): Promise<boolean> => {
    try {
      // reset any previous rating debug info
      this.setState({ ratingError: "", rawRatingPayload: undefined });
      const siteUrl = this.getSiteUrl();
      const digest = await this.getRequestDigest();
      // Try PnPJS rated API if available (best when supported)
      try {
        const pnp = (_sp as any);
        if (pnp && pnp.web && typeof pnp.web.lists === "function") {
          const item = pnp.web.lists.getByTitle(listTitle).items.getById(itemId);
          // try common PnP methods if they exist
          if (typeof item.setRating === "function") {
            await item.setRating(value);
            console.debug("PnPJS setRating succeeded");
            return true;
          }
          if (typeof item.rate === "function") {
            await item.rate(value);
            console.debug("PnPJS rate succeeded");
            return true;
          }
        }
      } catch (e) {
        console.debug("PnPJS rating attempt failed:", e);
      }

      // Multiple REST endpoint/payload shapes to try (different tenants expose different endpoints)
      const base = `${siteUrl}/_api/web/lists/getByTitle('${encodeURIComponent(listTitle)}')/items(${itemId})`;
      const attempts = [
        { url: `${base}/SetRating`, body: JSON.stringify({ rating: value }), method: "POST" },
        { url: `${base}/SetRating(${value})`, body: null, method: "POST" },
        { url: `${base}/Rate`, body: JSON.stringify({ rating: value }), method: "POST" },
        { url: `${base}/Rate(${value})`, body: null, method: "POST" },
        // Some tenants expect parameter name 'Rating' or 'value'
        { url: `${base}/SetRating`, body: JSON.stringify({ Rating: value }), method: "POST" },
        { url: `${base}/SetRating`, body: JSON.stringify({ Value: value }), method: "POST" },
        // fallback: send as querystring
        { url: `${base}/SetRating?rating=${value}`, body: null, method: "POST" },
      ];

      let lastResText = undefined as string | undefined;
      for (const a of attempts) {
        try {
          const headers: any = {
            Accept: "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
          };
          if (digest) headers["X-RequestDigest"] = digest;
          const res = await fetch(a.url, {
            method: a.method,
            credentials: "same-origin",
            headers,
            body: a.body,
          });
          const txt = await res.text().catch(() => "");
          lastResText = txt;
          console.debug("SetRating attempt:", a.url, res.status, res.statusText, txt);
          if (res.ok) {
            try { this.setState({ rawRatingPayload: txt }); } catch(e){
              // Non-critical: ignore if component already unmounted
              console.debug('setState(rawRatingPayload) failed/ignored:', e);

            }
            return true;
          }
        } catch (e) {
          console.debug("SetRating attempt threw for", a.url, e);
        }
      }
      // store debug info about last attempt
      this.setState({ ratingError: this.mapAccessError("All rating endpoints failed"), rawRatingPayload: lastResText });
      return false;
    } catch (e) {
      console.warn("trySetRatingEndpoint failed overall:", e);
      this.setState({ ratingError: this.mapAccessError(String(e)) });
      return false;
    }
  };

  private handleRate = async (item: ITileItem, value: number): Promise<void> => {
    try {
      const listTitle = this.state.activeList === "Agents" ? "Operational Excellence Agents" : "Industrialized Use cases";
      // Try server-side SetRating first (handles per-user ratings and counts)
      const setResult = await this.trySetRatingEndpoint(listTitle, Number(item.Id), value);
      if (setResult) {
        // refresh to pick up authoritative average/count
        try {
          // persist user's rating locally for UI consistency
          this.setLocalRatingForItem(listTitle, Number(item.Id), value);
        } catch (e) { /* ignore */ }
        await this.loadList(this.state.activeList);
        // update selectedItem in modal if it's the same item so UI updates immediately
        try {
          const updated = this.state.items.find((it) => it.Id === item.Id);
          if (updated) this.setState({ selectedItem: updated });
        } catch (e) { /* ignore */ }
        return;
      }

      // Next: try MERGE update to the list item using __metadata entity type (user-provided approach)
      try {
        const mergeOk = await this.updateRatingViaMerge(listTitle, Number(item.Id), value);
        if (mergeOk) {
          try {
            // persist user's rating locally for UI consistency
            this.setLocalRatingForItem(listTitle, Number(item.Id), value);
          } catch (e) { /* ignore */ }
          await this.loadList(this.state.activeList);
          try {
            const updated = this.state.items.find((it) => it.Id === item.Id);
            if (updated) this.setState({ selectedItem: updated });
          } catch (e) { /* ignore */ }
          return;
        }
      } catch (e) {
        console.debug('updateRatingViaMerge threw', e);
      }

      // Fallback: update avg/count fields directly (best-effort)
      const { avg: oldAvg, count: oldCount } = this.getRatingValues(item);
      // Check local cache to see if current user already rated this item
      const prevUserRating = this.getLocalRatingForItem(listTitle, Number(item.Id));
      const { newAvg, newCount } = this.computeNewAverageConsideringUser(oldAvg, oldCount, value, prevUserRating);
      const payload: { [k: string]: any } = {};
      if (this.ratingAvgField) payload[this.ratingAvgField] = newAvg;
      if (this.ratingCountField) payload[this.ratingCountField] = newCount;

      // optimistic UI update: update local state and selectedItem first
      this.setState((prev) => ({
        items: prev.items.map((it) => (it.Id === item.Id ? { ...it, ...(payload as any) } : it)),
        selectedItem: prev.selectedItem && prev.selectedItem.Id === item.Id ? { ...prev.selectedItem, ...(payload as any) } : prev.selectedItem,
      }), async () => {
        try {
          await this.updateRatingInSharePoint(listTitle, Number(item.Id), payload);
          // persist the user's rating locally so subsequent updates are treated as updates
          try { this.setLocalRatingForItem(listTitle, Number(item.Id), value); } catch (e) { /* ignore */ }
          // refresh items from server for authoritative data
          await this.loadList(this.state.activeList);
          // ensure selectedItem reflects refreshed data
          try {
            const updated = this.state.items.find((it) => it.Id === item.Id);
            if (updated) this.setState({ selectedItem: updated });
          } catch (e) { /* ignore */ }
        } catch (err) {
          // revert local optimistic update by reloading
          console.warn("Rating update failed, reloading items", err);
          await this.loadList(this.state.activeList);
          try {
            const updated = this.state.items.find((it) => it.Id === item.Id);
            if (updated) this.setState({ selectedItem: updated });
          } catch (e) { /* ignore */ }
        }
      });
    } catch (err) {
      console.error("handleRate error:", err);
    }
  };

  // NEW: format ISO date to relative string (e.g. "Just now", "5 min ago", "2 hours ago", "3 days ago", "Dec 3")
  private formatRelativeDate = (iso: string): string => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const diffMs = Date.now() - d.getTime();
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return "Just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} min ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
    // older than a week: show short date (e.g. "Dec 3" or include year if not current year)
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    const now = new Date();
    if (d.getFullYear() !== now.getFullYear()) {
      (options as any).year = "numeric";
    }
    return d.toLocaleDateString(undefined, options);
  };

  // Utility to get site base URL for REST calls (improved)
  private getSiteUrl = (): string => {
    const spctx = (window as any)._spPageContextInfo;
    console.debug("spPageContextInfo:", spctx);
    // prefer fully qualified webAbsoluteUrl
    if (spctx && spctx.webAbsoluteUrl) return spctx.webAbsoluteUrl;
    // then siteAbsoluteUrl
    if (spctx && spctx.siteAbsoluteUrl) return spctx.siteAbsoluteUrl;
    // then try to build from webServerRelativeUrl
    if (spctx && spctx.webServerRelativeUrl) {
      return window.location.origin + spctx.webServerRelativeUrl;
    }
    // fallback: try to grab a /sites/... path from current pathname
    const m = window.location.pathname.match(/\/sites\/[^/]+(\/[^/]+)?/);
    if (m && m[0]) return window.location.origin + m[0];
    // final fallback: origin
    return window.location.origin;
  };

  // Convert low-level error strings into user-friendly messages when access is denied
  private mapAccessError = (msg: string): string => {
    if (!msg || typeof msg !== 'string') return msg;
    if (/404/.test(msg) || /Cannot find resource/.test(msg) || /does not exist at site/.test(msg) || /access denied/i.test(msg) || /403/.test(msg)) {
      return "Comments are temporarily unavailable. Please try again later.";
    }
    return msg;
  };

  // derive an alternate site URL from the current page path (/sites/YourSite/... ) to retry when list not found
  private deriveAltSiteFromPath = (): string | undefined => {
    const path = window.location.pathname;
    // try to match /sites/<siteCollection> or /sites/<siteCollection>/<web>
    const m = path.match(/\/sites\/[^/]+(\/[^/]+)?/);
    if (m && m[0]) {
      return window.location.origin + m[0];
    }
    return undefined;
  };

  // Add: obtain a request digest (try page, then _api/contextinfo)
  private getRequestDigest = async (): Promise<string | undefined> => {
    try {
      // prefer SharePoint page context digest if available
      const spctx = (window as any)._spPageContextInfo;
      if (spctx && spctx.formDigestValue) return spctx.formDigestValue;
      // fallback to __REQUESTDIGEST element (classic pages)
      const el = document.getElementById("__REQUESTDIGEST") as HTMLInputElement | null;
      if (el && el.value) return el.value;

      // final fallback: request contextinfo from current site
      const siteUrl = this.getSiteUrl();
      const res = await fetch(`${siteUrl}/_api/contextinfo`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json;odata=nometadata",
        },
      });
      if (!res.ok) return undefined;
      const json = await res.json();
      // different tenants/versions expose the digest in different places
      return json?.FormDigestValue || json?.GetContextWebInformation?.FormDigestValue;
    } catch (e) {
      console.warn("Could not obtain request digest", e);
      return undefined;
    }
  };
    
// Cleans up rich HTML from SharePoint fields by removing unwanted formatting.
// This ensures user-provided HTML cannot override the app's styles (e.g., fonts, colors).
private sanitizeRichHtml(html: string): string {
  if (!html || typeof html !== "string") return "";
  let out = html;
  // Remove all <font> tags
  out = out.replace(/<\/?font[^>]*>/gi, "");
  // Remove inline style attributes (e.g., style="color:red;")
  out = out.replace(/\sstyle=(['"]).*?\1/gi, "");
  // Remove Office-specific tags like <o:p>...</o:p>
  out = out.replace(/<o:p>[\s\S]*?<\/o:p>/gi, "");
  return out;
}

  public render(): React.ReactElement<IListDataWebPartProps> {
    const {
      groupedItems,
      collapsedSections,
      showModal,
      selectedItem,
      fieldMap,
      loading,
      searchQuery,
      activeList,
      commentsByItem,
      commentInput,
      commentPosting,
      commentError,
    } = this.state;
    const caseStudies = this.caseStudies;
    // Bypass generated CSS module typings for newly added classes
    const S = styles as any;
    const overlayImageUrl = "https://capgemini.sharepoint.com/:i:/r/sites/KnowNow/AIMarketplace/SiteAssets/SitePages/AI%20Marketplace%20Icons/Banner%20icon.png?csf=1&web=1&e=SojULM";
    const overlayImageUrl2 = "https://capgemini.sharepoint.com/:i:/r/sites/KnowNow/AIMarketplace/SiteAssets/SitePages/AI%20Marketplace%20Icons/AI%20Marketplace%20bold%20heading.png?csf=1&web=1&e=41NThX";
    const overlayImageUrl3 = "https://capgemini.sharepoint.com/:i:/r/sites/KnowNow/AIMarketplace/SiteAssets/SitePages/AI%20Marketplace%20Icons/AI%20Marketplace%20bold%20quote.png?csf=1&web=1&e=LvAcxA";
    const overlayImages = [
            { url: overlayImageUrl, alt: "Overlay banner", left: "50%", top: "-35px", height: "164%", maxWidth: "375px" },
      { url: overlayImageUrl2, alt: "Overlay banner 2", left: "15%", top: "-12px", height: "130%", maxWidth: "300px" },
      { url: overlayImageUrl3, alt: "Overlay banner 3", left: "85%", top: "5px", height: "100%", maxWidth: "300px" },
    ].filter((item) => Boolean(item.url));
    
    return (
      <div className={styles.webpartContainer}>
        {/* Fixed Header */}
        <div className={styles.fixedHeader}>
          {/* Banner */}
          <div className={styles.bannerWrapper}>
            <img
              src="https://capgemini.sharepoint.com/:i:/r/sites/KnowNow/AIMarketplace/SiteAssets/SitePages/AI%20Marketplace%20Icons/AI%20Marketplace%20banner.jpg?csf=1&web=1&e=wnSGUp"
              alt="Banner"
              className={styles.bannerImage}
            />
            {overlayImages.map((overlay, index) => (
              <img
                key={`${overlay.alt}-${index}`}
                src={overlay.url}
                alt={overlay.alt}
                className={styles.bannerOverlayImage}
                style={{
                  left: overlay.left,
                  top: overlay.top,
                  height: overlay.height,
                  maxWidth: overlay.maxWidth,
                }}
              />
            ))}
            {/* <h1 className={styles.bannerTitle}>Sogeti AI Marketplace</h1> */}
          </div>
          {/* Search bar and toggles */}
          <div className={styles.searchBarContainer}>
            {/* List toggle (Starter Pack / Agents) placed left of search */}
            <div className={styles.segmentedToggle} style={{ marginRight: 12 }} role="tablist" aria-label="List toggle">
              <button
                className={`${styles.segmentButton} ${this.state.activeList === 'Starter Pack' ? styles.activeSegment : ''}`}
                onClick={() => { this.trackEvent('list_toggle', { buttonLabel: 'Starter Pack' }); this.loadList('Starter Pack').catch(()=>{}); }}
                title="Starter Pack"
              >
                Starter Pack
              </button>
              <button
                className={`${styles.segmentButton} ${this.state.activeList === 'Agents' ? styles.activeSegment : ''}`}
                onClick={() => { this.trackEvent('list_toggle', { buttonLabel: 'Agents' }); this.loadList('Agents').catch(()=>{}); }}
                title="Agents"
              >
                Agents
              </button>
            </div>

            <input
              type="text"
              placeholder="🔍Search by any word..."
              value={searchQuery}
              onChange={this.handleSearchChange}
              className={styles.searchInput}
            />
            {/* Theme Toggle (Business = light, Technical = dark) */}
            {/* <div className={styles.segmentedToggle} role="tablist" aria-label="Theme toggle">
              <button
                className={`${styles.segmentButton} ${
                  this.state.themeMode === "Business" ? styles.activeSegment : ""
                }`}
                onClick={() => this.toggleTheme("Business")}
                title="Business (light)"
              >
                Business
              </button>
              <button
                className={`${styles.segmentButton} ${
                  this.state.themeMode === "Technical" ? styles.activeSegment : ""
                }`}
                onClick={() => this.toggleTheme("Technical")}
                title="Technical (dark)"
              >
                Technical
              </button>
            </div> */}
            <button
              className={styles.toggleAllButton}
              onClick={() => {
  this.trackEvent("toggle_all", { buttonLabel: this.state.toggleButtonText });
  this.handleToggleAll();
}}
            >
              {this.state.toggleButtonText}
            </button>
            <button
              className={styles.toggleAllButton}
              onClick={() => {
  this.trackEvent("open_form", { buttonLabel: "Create your own Starter Pack" });
  this.openForm();
}}
              title="Create your own Starter Pack"
              style={{ marginLeft: 10 }}
            >
              Create your own Starter Pack
            </button>
            {/* Contact moved beside Create button */}
            <button
              className={styles.toggleAllButton}
              onClick={() => { this.trackEvent('open_contact', { buttonLabel: 'Contact us' }); this.openContact(); }}
              title="Contact us"
              style={{ marginLeft: 10 }}
            >
              Contact us
            </button>
          </div>
        </div>
        {/* Flex container for left and right panels */}
        <div className={styles.scrollableContent}>
          <div className={styles.contentWrapper}>
                {/* Left Sidebar removed — navigation moved to header segmented toggle */}
                {/* Center content (section headers and tiles) */}
                <div className={styles.centerPanel}>
                  {!loading && (
                    <div className={S.sectionDesc}>
                      {activeList === 'Agents' ? (
                        <div className={S.sectionIntroInner}><strong>Agents:</strong> Autonomous AI systems that reason, decide, and act on tasks or workflows with minimal human input.</div>
                      ) : (
                        <div className={S.sectionIntroInner}><strong>Starter Packs:</strong> AI Starter packs are prebuilt workflows with industry-specific trained orchestrated agents. This helps your clients move from idea to production faster.</div>
                      )}
                    </div>
                  )}
                  {loading ? (
                    <div>Loading...</div>
                  ) : (
                    (Object.entries(groupedItems) as [string, ITileItem[]][])
                      .sort(([a]: [string, ITileItem[]], [b]: [string, ITileItem[]]) => a.localeCompare(b))
                      .map(([group, items]: [string, ITileItem[]]) => (
                        <div
                          key={group}
                          id={`section-${group}`}
                          className={styles.section}
                        >
                          <div
                            className={styles.sectionHeader}
                            data-group-key={group}
                            onClick={() => this.toggleSection(group)}
                          >
                            <h2>
                              {group} ({items.length})
                            </h2>
                            <span>{collapsedSections[group] ? "+" : "-"}</span>
                          </div>
                          {!collapsedSections[group] && (
                            <div className={styles.tilesContainer}>
                              {items.map((item: ITileItem) => (
                                <div
                                  key={item.Id}
                                  className={styles.tile}
                                  onClick={() => {
                                    this.trackEvent("tile_open", {
                                      buttonLabel: "tile",
                                      itemTitle: item.Title,
                                      itemId: item.Id,
                                      industry: group,
                                    });
                                    this.openModal(item);
                                  }}
                                >
                                  <h3 lang="en">{item.Title}</h3>
                                  <br />
                                  <h5>{this.getTileText(item)}</h5>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
                {/* Left Panel close*/}
                {/* Right Panel */}
                <div className={styles.rightPanel}>
                  <div className={styles.floatingSidebar}>
                    {/* {this.state.activeList === "Agents" && ( */}
                        <div className={styles.credentialsBox} onClick={(e) => e.stopPropagation()} style={{ marginBottom: 8 }}>
                          <div className={styles.credentialsTitle}>
                            Demo environment for <a
                              href="https://agenticexperience.azurewebsites.net/login"
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.credentialsLink}
                              onClick={(e) => {
  e.stopPropagation();
  this.trackEvent("demo_env_link_click", {
    buttonLabel: "Agentic Experience",
    url: "https://agenticexperience.azurewebsites.net/login",
  });
}}
                            >Agentic Experience</a>
                          </div>
                          <div className={styles.credentialLine}>Login as Guest User</div>
                          {/* <div className={styles.credentialLine}><strong>Password</strong> - <span className={styles.credentialValue}>demo2025</span></div> */}
                        </div>
                        <div className={styles.credentialsBox} onClick={(e) => e.stopPropagation()} style={{ marginBottom: 8 }}>
                          <div className={styles.credentialsTitle}>
                            <a
                              href="https://sogeti.navattic.com/flowofagenticsystem?g=cmgg9vmwh000004lccfo0cg8o&s=0"
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.credentialsLink}
                              onClick={(e) => {
                                e.stopPropagation();
                                this.trackEvent("agentic_flow_link_click", {
                                  buttonLabel: "How to use Agentic Platform? A click through guide",
                                  url: "https://sogeti.navattic.com/flowofagenticsystem?g=cmgg9vmwh000004lccfo0cg8o&s=0",
                                });
                              }}
                            >How to use Agentic Platform? A click through guide</a>
                          </div>
                        </div>
                      {/* )} */}
                    <h4 style={{ margin: "2px" }}>Industry</h4>
                    <div className={styles.scrollArea}>
                      <select
                        className={S.industrySelect}
                        defaultValue={'All industries'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'All industries') {
                            const newCollapsed: { [k: string]: boolean } = {};
                            Object.keys(groupedItems).forEach((k) => (newCollapsed[k] = false));
                            this.setState({ collapsedSections: newCollapsed });
                            this.trackEvent('industry_select', { value: val });
                            return;
                          }
                          const newCollapsed: { [k: string]: boolean } = {};
                          Object.keys(groupedItems).forEach((k) => (newCollapsed[k] = k !== val));
                          this.setState({ collapsedSections: newCollapsed }, () => {
                            this.trackEvent('industry_select', { value: val });
                            const sectionElement = document.getElementById(`section-${val}`) as HTMLElement | null;
                            const centerPanel = document.querySelector(`.${styles.centerPanel}`) as HTMLElement | null;
                            const STICKY_OFFSET = 80;
                            if (sectionElement && centerPanel && centerPanel.contains(sectionElement)) {
                              const top = sectionElement.offsetTop;
                              centerPanel.scrollTo({ top: Math.max(0, top - STICKY_OFFSET), behavior: 'smooth' });
                            } else {
                              sectionElement?.scrollIntoView({ behavior: 'smooth' });
                            }
                          });
                        }}
                      >
                        <option value="All industries">All industries</option>
                        {Object.keys(groupedItems)
                          .sort()
                          .map((group) => (
                            <option key={group} value={group}>
                              {group}
                            </option>
                          ))}
                      </select>
                      </div>
                  </div>
                  <div className={styles.caseStudyCarousel}>
                    <div className={styles.carouselTitle}>
                        Case Studies
                    </div>
                    <div className={styles.marqueeContainer}>
                        <div className={styles.marqueeContent}>
                          {[...caseStudies, ...caseStudies].map((item, idx) => (
                            <div
                              key={idx}
                              className={styles.carouselCard}
                              onClick={() => window.open(item.url, "_blank")}
                            >
                              <img
                                src={item.thumbnail}
                                alt={item.title}
                                className={styles.carouselImage}
                              />
                              <div className={styles.carouselLabel}>
                                {item.title}
                              </div>
                            </div>
                          ))}
                        </div>
                    </div>
                  </div>
                </div>
                {/* Right Panel close*/}
          </div>
        </div>
        {showModal && selectedItem && (
          <div className={styles.modalOverlay} onClick={this.closeModal}>
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
              tabIndex={0}
              ref={this.modalContentRef}
            >
              <button
                className={styles.closeButton}
                onClick={this.closeModal}
                aria-label="Close"
                type="button"
              >
                &times;
              </button>
              {/* title moved into left column */}
              {/* Links moved to the right column (Quick Links) */}

              {/* NEW: modal split layout: main content (80%) + comments (20%) */}
              <div className={S.modalLayout}>
                <div className={S.modalMain}>
                  {(() => {
                    const linkFields = this.getLinkFieldsForItem(selectedItem) || [];
                    const agentic = linkFields.find((lf) => (lf.label || '').toString().trim().toLowerCase().includes('agentic'));
                    return (
                      <div className={styles.modalHeaderRow}>
                        <h2 className={styles.modalTitle}>{this.getDisplayValue(selectedItem.Title)}</h2>
                        {agentic && agentic.url ? (
                          <a
                            href={agentic.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.linkButton} ${styles.agenticButton}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              this.trackEvent('link_click', { buttonLabel: agentic.label, url: agentic.url, itemTitle: selectedItem.Title, itemId: selectedItem.Id });
                            }}
                          >
                            {this.renderIconForField(agentic.label || 'Agentic Link', true)}
                            <span style={{ flex: 1, textAlign: 'left' }}>{agentic.label || 'Agentic Link'}</span>
                          </a>
                        ) : null}
                      </div>
                    );
                  })()}
                  <div className={styles.modalScrollArea}>
                    {/* If this item has a Demo Video link (display name exactly "Demo Video"), render it inside the scrollable area */}
                    {/* Solution Summary (render above the video, no title) */}
                    {(() => {
                      try {
                        const sol = (Object.entries(selectedItem) as [string, unknown][]).find(([k]) => ((fieldMap[k] || '').toString().trim().toLowerCase() === 'solution summary'));
                        if (sol && sol[1]) {
                          const txt = String(sol[1] || '').trim();
                          if (txt) {
                            const hasHTML = /<\/?[a-z][\s\S]*>/i.test(txt);
                            if (hasHTML) {
                              const sanitized = this.sanitizeRichHtml(txt);
                              return <div className={styles.richTextContent} dangerouslySetInnerHTML={{ __html: sanitized }} style={{ marginBottom: 12 }} />;
                            }
                            return <div style={{ marginBottom: 12 }}>{this.getDisplayValue(txt)}</div>;
                          }
                        }
                      } catch (e) {
                        // ignore
                      }
                      return null;
                    })()}

                    {(() => {
                      const linkFields = this.getLinkFieldsForItem(selectedItem);
                      const demoField = linkFields.find((lf) => (lf.label || '').toString().trim().toLowerCase() === 'demo video');
                      const demoUrl = demoField && demoField.url ? demoField.url : undefined;
                      if (demoUrl) {
                        return (
                          <div className={S.modalVideoContainer} onClick={(e) => e.stopPropagation()} style={{ marginBottom: 12 }}>
                            <video
  controls
  playsInline
  preload="metadata"
  className={S.modalVideoPlayer}
  onPlay={() => {
    this.trackEvent("video_play", {
      buttonLabel: "Demo Video",
      videoUrl: demoUrl,
      itemTitle: selectedItem.Title,
      itemId: selectedItem.Id,
    });
  }}
  onPause={() => {
    this.trackEvent("video_pause", {
      buttonLabel: "Demo Video",
      videoUrl: demoUrl,
      itemTitle: selectedItem.Title,
      itemId: selectedItem.Id,
    });
  }}
>
                              <source src={demoUrl} />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* duplicate Solution Summary (removed) - already rendered above the video */}

                    {/* Tabs under the video */}
                    <div style={{ marginBottom: 12 }}>
                      {(() => {
                        const activeTab = (this.state && this.state.modalTab) || 'overview';
                        return (
                          <div>
                            <div className={styles.modalTabs}>
                              <button type="button" className={`${styles.tabButton} ${activeTab === 'overview' ? styles.tabActive : ''}`} onClick={() => this.setState({ modalTab: 'overview' })}>Overview</button>
                              <button type="button" className={`${styles.tabButton} ${activeTab === 'business' ? styles.tabActive : ''}`} onClick={() => this.setState({ modalTab: 'business' })}>Agent Workflow</button>
                              <button type="button" className={`${styles.tabButton} ${activeTab === 'integration' ? styles.tabActive : ''}`} onClick={() => this.setState({ modalTab: 'integration' })}>{(this.state && this.state.themeMode === 'Technical') ? 'Business Impacts' : 'Integration'}</button>
                            </div>
                            <div>
                              {activeTab === 'overview' && (
                                <div className={styles.tabContentSection}>
                                  {(() => {
                                    const wanted = ['description', 'brief description', 'long description', 'problem solved', 'industry'];
                                    return (Object.entries(selectedItem) as [string, unknown][])
                                      .filter(([k, v]) => wanted.includes(((fieldMap[k] || '').toString().trim().toLowerCase())))
                                      .map(([k, v]) => (
                                        <div key={k} style={{ marginBottom: 8 }}>
                                          <strong>{fieldMap[k]}</strong>
                                          <div>
                                            {typeof v === 'string' && /<\/?[a-z][\s\S]*>/i.test(v) ? (
                                              <div className={styles.richTextContent} dangerouslySetInnerHTML={{ __html: this.sanitizeRichHtml(String(v)) }} />
                                            ) : (
                                              this.getDisplayValue(v)
                                            )}
                                          </div>
                                        </div>
                                      ));
                                  })()}
                                </div>
                              )}
                              {activeTab === 'business' && (
                                <div className={styles.tabContentSection}>
                                  {(() => {
                                    const wanted = ['agents involved', 'agent tags', 'high level workflow'];
                                    return (Object.entries(selectedItem) as [string, unknown][])
                                      .filter(([k, v]) => wanted.includes(((fieldMap[k] || '').toString().trim().toLowerCase())))
                                      .map(([k, v]) => {
                                        const label = (fieldMap[k] || '').toString().trim();
                                        const labelLower = label.toLowerCase();
                                        if (labelLower === 'agents involved') {
                                          const raw = String(v || '');
                                          const withNewlines = raw.replace(/<\/?div[^>]*>/gi, '\n').replace(/<br\s*\/?/gi, '\n');
                                          const stripped = withNewlines.replace(/<[^>]+>/g, '');
                                          const cleaned = stripped.replace(/&nbsp;|&amp;/g, ' ').replace(/\n\s+/g, '\n').trim();
                                          const lines = cleaned.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
                                          // remove lines that are only separators like '>' or dashes
                                          const entries = lines.filter((ln) => !/^[>\-–—\s]+$/.test(ln));
                                          return (
                                            <div key={k} style={{ marginBottom: 8 }}>
                                              <div className={styles.workflowVertical} style={{ marginTop: 8 }}>
                                                {entries.map((ln, i) => {
                                                  // Parse optional bracketed metadata beside the agent name
                                                  const m = ln.match(/^([^\u005B]+)\s*\u005B([\s\S]*)\u005D$/);
                                                  const main = m ? m[1].trim() : ln;
                                                  const meta = m ? m[2].trim() : undefined;
                                                  return (
                                                    <React.Fragment key={i}>
                                                      <div className={styles.workflowRow}>
                                                        <span className={styles.workflowStep}>{main}</span>
                                                        {meta ? <span className={styles.workflowMeta}>[{meta}]</span> : null}
                                                      </div>
                                                      {i < entries.length - 1 && (
                                                        <div className={styles.workflowConnector} aria-hidden>
                                                          <span className={styles.arrowDown}>↓</span>
                                                        </div>
                                                      )}
                                                    </React.Fragment>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          );
                                        }

                                        // Render High level workflow as pill steps with arrows
                                        if (labelLower === 'high level workflow') {
                                          const steps = String(v || '')
                                            .split('>')
                                            .map((s) => s.trim())
                                            .filter(Boolean);
                                          return (
                                            <div key={k} style={{ marginBottom: 12 }}>
                                              <strong>{fieldMap[k]}</strong>
                                              <div className={styles.workflowInline} style={{ marginTop: 8 }}>
                                                {steps.map((step, idx) => (
                                                  <React.Fragment key={idx}>
                                                    <span className={styles.workflowStep}>{step}</span>
                                                    {idx < steps.length - 1 && <span className={styles.arrow}>→</span>}
                                                  </React.Fragment>
                                                ))}
                                              </div>
                                            </div>
                                          );
                                        }

                                        return (
                                          <div key={k} style={{ marginBottom: 8 }}>
                                            <strong>{fieldMap[k]}</strong>
                                            <div>{this.getDisplayValue(v)}</div>
                                          </div>
                                        );
                                      });
                                  })()}
                                </div>
                              )}
                              {activeTab === 'integration' && (
                                <div className={styles.tabContentSection}>
                                  {(() => {
                                    // Integration tab should surface Impact/Impact Map and (in Technical) Expected ROI
                                    let wanted = (this.state && this.state.themeMode === 'Technical') ? ['expected roi metrics', 'impact', 'impact map'] : ['availability', 'impact', 'impact map'];
                                    // If this modal is opened for the Starter Pack list and we're in
                                    // Business (non-Technical) theme, the right panel already shows
                                    // Impact — avoid duplicating the Impact field inside Integration.
                                    if (this.state && this.state.activeList === 'Starter Pack' && this.state.themeMode !== 'Technical') {
                                      wanted = wanted.filter((x) => x !== 'impact');
                                    }
                                    return (Object.entries(selectedItem) as [string, unknown][])
                                      .filter(([k, v]) => wanted.includes(((fieldMap[k] || '').toString().trim().toLowerCase())))
                                      .map(([k, v]) => {
                                        const label = (fieldMap[k] || '').toString().trim().toLowerCase();
                                        if (label === 'impact') {
                                          return (
                                            <div key={k} style={{ marginBottom: 8 }}>
                                              <div style={{ whiteSpace: 'pre-wrap', fontWeight: 'normal' }}>{this.getDisplayValue(v)}</div>
                                            </div>
                                          );
                                        }

                                        if (label === 'impact map') {
                                          return (
                                            <div key={k} style={{ marginBottom: 12 }}>
                                              <div style={{ fontWeight: 700, color: (this.state && this.state.themeMode === 'Technical') ? '#9adff0' : '#0070AD', marginBottom: 6 }}>{fieldMap[k]}</div>
                                              <div style={{ whiteSpace: 'pre-wrap', fontWeight: 'normal' }}>{this.getDisplayValue(v)}</div>
                                            </div>
                                          );
                                        }

                                        // Technical-mode: render Expected ROI Metrics as human-readable text lines
                                        if (label === 'expected roi metrics') {
                                          let vals: string[] = [];
                                          try {
                                            if (Array.isArray(v)) vals = (v as any[]).map(x => String(x));
                                            else {
                                              const s = String(v || '').trim();
                                              try {
                                                const parsed = JSON.parse(s);
                                                if (Array.isArray(parsed)) vals = parsed.map((x: any) => String(x));
                                                else vals = s.split(/\r?\n|;|,/).map((x) => x.trim()).filter(Boolean);
                                              } catch (e) {
                                                vals = s.split(/\r?\n|;|,/).map((x) => x.trim()).filter(Boolean);
                                              }
                                            }
                                          } catch (e) { vals = [] }

                                          return (
                                            <div key={k} style={{ marginBottom: 8 }}>
                                              <strong>{fieldMap[k]}</strong>
                                              <div style={{ marginTop: 6 }}>
                                                {vals.map((rawValue, idx) => {
                                                  const cleaned = String(rawValue || '').trim().replace(/^[\u005B\u005D"']+|[\u005B\u005D"']+$/g, '').trim();
                                                  const numMatch = cleaned.match(/([+-]?\d+(?:\.\d+)?%?)/);
                                                  const hasApprox = /\bapprox\b|~/.test(cleaned.toLowerCase());
                                                  const valueText = numMatch ? numMatch[1] : undefined;
                                                  const labelText = (cleaned.replace(valueText ? valueText : '', '') || '').replace(/^(approx[:\s-]*)/i, '').trim();
                                                  return (
                                                    <div key={idx} style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>
                                                      {(hasApprox ? '~' : '')}{valueText ? valueText + (labelText ? ' ' : '') : ''}{labelText}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          );
                                        }

                                        return (
                                          <div key={k} style={{ marginBottom: 8 }}>
                                            <strong>{fieldMap[k]}</strong>
                                            <div>{this.getDisplayValue(v)}</div>
                                          </div>
                                        );
                                      });
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <ul>
                      {/* General fields except "High level workflow" and "Contact name" */}
                      {(Object.entries(selectedItem) as [string, unknown][])
                        .filter(([key, value]: [string, unknown]) => {
                          // must have a display label and not be the workflow field
                          if (!fieldMap[key] || fieldMap[key] === "High level workflow") return false;
                          // Exclude Title field to avoid repetition
                          if (key === "Title" || fieldMap[key] === "Title") return false;
                              // Exclude "Demo description" and "Contact name" fields to display elsewhere
                              if ((fieldMap[key] || '').toString().trim().toLowerCase() === 'demo description') return false;
                              if (fieldMap[key] === "Contact name") return false;
                              // Exclude "Sample Input File" to display it at the bottom
                              if ((fieldMap[key] || '').toString().trim().toLowerCase() === 'sample input file') return false;
                              // exclude any detected URL/link fields so they only appear as icons in the right links panel
                          const detectedLinkKeys = (this.getLinkFieldsForItem(selectedItem) || []).map((lf) => lf.key);
                          if (detectedLinkKeys.includes(key)) return false;

                              // Exclude fields that are surfaced in the modal tabs (they are shown in the tabbed UI instead)
                              const labelLower = (fieldMap[key] || '').toString().trim().toLowerCase();
                              const tabLabels = [
                                'description','brief description','long description','problem solved','impact','impact map',
                                'agents involved','agent tags','high level workflow','availability','solution summary','expected roi metrics',
                                // technical-only fields that should not appear in the left/main list
                                'llms leveraged','supported hyperscalers','agent development framework'
                              ];
                              if (tabLabels.includes(labelLower)) return false;

                          // Hide empty values: null, undefined, empty string, empty arrays, or empty objects
                          if (value === null || value === undefined) return false;
                          if (typeof value === 'string' && value.trim() === '') return false;
                          if (Array.isArray(value) && value.length === 0) return false;
                          if (typeof value === 'object') {
                            try {
                              if (!Array.isArray(value) && Object.keys(value).length === 0) return false;
                            } catch (e) {
                              // If inspection fails, keep the field (safer to show)
                            }
                          }

                          // Special-case: the default SharePoint "Attachments" column is often a boolean
                          // (true = has attachments, false = none). Treat false as empty so the column
                          // doesn't show when no files are attached. Match by display label or internal name.
                          const displayLabel = (fieldMap[key] || '').toString().toLowerCase();
                          // Hide 'Industry' here because it's surfaced in the Overview tab
                          if (displayLabel === 'industry') return false;
                          // Remove Agent Owner entirely from modal display
                          if (displayLabel === 'agent owner') return false;
                          if (displayLabel === 'attachments' || key.toString().toLowerCase() === 'attachments' || key.toString().toLowerCase().includes('attachment')) {
                            if (value === false) return false;
                            // also handle AttachmentFiles/arrays/empty objects (already covered above)
                            }
                          // Always hide any column related to status from the modal UI (case-insensitive)
                          if (
                            displayLabel === 'status' ||
                            displayLabel === 'agent status' ||
                            key.toString().toLowerCase().includes('status') ||
                            (fieldMap[key] || '').toString().toLowerCase().includes('status')
                          ) {
                            return false;
                          }

                          return true;
                        })
                        .sort((a: [string, unknown], b: [string, unknown]) => {
                          // For the Starter Pack list, ensure the field labelled "Description"
                          // appears first (directly below the video). Otherwise keep order.
                          try {
                            if (this.state && this.state.activeList === "Starter Pack") {
                              const la = (fieldMap[a[0]] || "").toString().toLowerCase();
                              const lb = (fieldMap[b[0]] || "").toString().toLowerCase();
                              if (la === "description" && lb !== "description") return -1;
                              if (lb === "description" && la !== "description") return 1;
                            }
                          } catch (e) {
                            // if anything goes wrong, fall back to original order
                          }
                          return 0;
                        })
                        .map(([key, value]: [string, unknown]) => {
                          // Skip rendering the Rating (0-5) field, rating count, and likes here —
                          // ratings UI is shown in the comments/ratings panel and likes should be hidden per UX.
                          const isRatingField =
                            key === this.ratingAvgField ||
                            fieldMap[key] === "Rating (0-5)";
                          const isRatingCountField =
                            (this.ratingCountField && key === this.ratingCountField) ||
                            fieldMap[key] === "Number of Ratings" ||
                            fieldMap[key] === "NumberOfRatings" ||
                            fieldMap[key] === "RatingsCount";
                          const isLikesField =
                            fieldMap[key] === "Number of Likes" ||
                            fieldMap[key] === "Likes" ||
                            fieldMap[key] === "LikeCount";

                          if (isRatingField || isRatingCountField || isLikesField) {
                            return null;
                          }
                          return (
                            <li key={key}>
                              <div>
                                <strong>{fieldMap[key]}</strong>
                              </div>
                              <div>
                                {(() => {
                                  const stringValue = String(value).trim();

                                  // Check if value contains HTML tags (rich text)
                                  const hasHTML = /<\/?[a-z][\s\S]*>/i.test(
                                    stringValue
                                  );

                                   if (hasHTML) {
                                    const sanitized = this.sanitizeRichHtml(stringValue);
                                    return (
                                      <div
                                        className={styles.richTextContent}
                                        dangerouslySetInnerHTML={{
                                          __html: sanitized,
                                        }}
                                      />
                                    );
                                  }

                                  if (
                                    typeof value === "object" &&
                                    value !== null &&
                                    "Url" in value
                                  ) {
                                    const urlObj = value as {
                                      Url: string;
                                      Description?: string;
                                    };
                                    return (
                                      <a
                                        href={urlObj.Url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.link}
                                      >
                                        {urlObj.Description || urlObj.Url}
                                      </a>
                                    );
                                  }
                                  if (
                                    stringValue.startsWith("http") &&
                                    (stringValue.endsWith(".mp4") ||
                                      stringValue.endsWith(".mov") ||
                                      stringValue.endsWith(".avi") ||
                                      stringValue.includes("video"))
                                  ) {
                                    return (
                                      <a
                                        href={stringValue}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.link}
                                      >
                                        {stringValue}
                                      </a>
                                    );
                                  }

                                  // If a plain string contains an HTTP URL, render a link using a friendly filename
                                  if (typeof value === 'string') {
                                    try {
                                      const detected = this.extractUrlFromValue(value);
                                      if (detected) {
                                        const filename = this.getFilenameFromUrl(detected) || detected;
                                        return (
                                          <a href={detected} target="_blank" rel="noopener noreferrer" className={styles.link}>
                                            {filename}
                                          </a>
                                        );
                                      }
                                    } catch (e) {
                                      // fall through to default display
                                    }
                                  }

                                  return this.getDisplayValue(value);
                                })()}
                              </div>
                            </li>
                          );
                        })}

                      {/* Contact name moved to Technical Details on the right (when in Technical mode) */}

                      {/* Render "Sample Input File" at the bottom */}
                      {(Object.entries(selectedItem) as [string, unknown][]).map(([key, value]: [string, unknown]) => {
                        // Sample Input File rendering removed from main modal list — moved to Quick Links on the right
                        return null;
                      })}
                    </ul>
                  </div>
                </div>

                {/* Comments panel (split: ratings 20% + comments 80%) */}
                <div className={S.commentsPanel}>
                  {/* Expected ROI Metrics (card) */}
                  {(() => {
                    try {
                      const roiEntry = (Object.entries(selectedItem) as [string, unknown][]).find(([k]) => ((fieldMap[k] || '').toString().trim().toLowerCase() === 'expected roi metrics'));
                      // Capture the standalone Impact field (if present) to render when ROI is missing or below ROI cards
                      let impactStr: string | undefined = undefined;
                      let impactKey: string | undefined = undefined;
                      try {
                        const impactEntry = (Object.entries(selectedItem) as [string, unknown][]).find(([k]) => ((fieldMap[k] || '').toString().trim().toLowerCase() === 'impact'));
                        if (impactEntry && impactEntry[1]) {
                          impactKey = impactEntry[0];
                          const impactRaw = impactEntry[1];
                          if (Array.isArray(impactRaw)) impactStr = (impactRaw as any[]).map((x) => String(x)).join(' ');
                          else impactStr = String(impactRaw || '');
                          if (impactStr && impactStr.trim().length === 0) impactStr = undefined;
                        }
                      } catch (e) { /* ignore */ }

                      if (roiEntry && roiEntry[1]) {
                        const displayLabel = (fieldMap[roiEntry[0]] || 'Expected ROI Metrics').toString();
                        let vals: string[] | null = null;
                        const raw = roiEntry[1];
                        if (Array.isArray(raw)) {
                          vals = (raw as any[]).map((x) => String(x));
                        } else {
                          const s = String(raw || '').trim();
                          try {
                            const parsed = JSON.parse(s);
                            if (Array.isArray(parsed)) vals = parsed.map((x: any) => String(x));
                            else vals = [s];
                          } catch (e) {
                            vals = s.split(/\r?\n|;|,/).map((x) => x.trim()).filter(Boolean);
                          }
                        }

                        const renderCard = (v: string, i: number) => {
                          const itemId = (selectedItem && (selectedItem as any).Id) || 'item';
                          const key = `${itemId}-${i}`;
                          const rawText = String(v || '').trim();
                          const stripBracketsQuotes = (s: string): string => {
                            let out = String(s || '').trim();
                            while (out.length > 0) {
                              const first = out.charAt(0);
                              const last = out.charAt(out.length - 1);
                              if (first === '[' || first === ']' || first === '"' || first === "'") out = out.substring(1);
                              else if (last === '[' || last === ']' || last === '"' || last === "'") out = out.substring(0, out.length - 1);
                              else break;
                            }
                            return out.trim();
                          };
                          const cleaned = stripBracketsQuotes(rawText);
                          // Normalize whitespace and line breaks so ranges split across lines ("40\n-70%") are captured
                          const cleanedNormalized = String(cleaned || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
                          // Prefer numeric ranges (e.g. "40-70%"), accept ASCII hyphen, en-dash, em-dash
                          // Accept ASCII hyphen, en-dash, em-dash without unnecessary escaping
                          const rangeMatch = cleanedNormalized.match(/([+-]?\d+(?:\.\d+)?%?\s*[-–—]\s*[+-]?\d+(?:\.\d+)?%?)/u);
                          const singleMatch = cleanedNormalized.match(/([+-]?\d+(?:\.\d+)?%?)/u);
                          const hasApprox = /\bapprox\b|\bapprox\.?\b|~/.test(rawText || cleanedNormalized);
                          const rawNumber = rangeMatch ? rangeMatch[1] : (singleMatch ? singleMatch[1] : undefined);
                          const valueText = rawNumber ? rawNumber : undefined;
                          const labelRaw = cleanedNormalized.replace(valueText ? valueText : '', '').replace(/^(approx[:\s-]*)/i, '').trim();
                          const labelWords = labelRaw;
                          const label = labelWords || (rawNumber ? '' : cleaned);
                          // trend (up/down) removed per UX request — visual arrows not required
                          const expanded = !!(this.state.roiExpanded && this.state.roiExpanded[key]);

                          return (
                            <div key={i} className={styles.roiCard} role="button" tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); this.toggleRoiCard(key); }}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); this.toggleRoiCard(key); } }}>
                              {valueText ? (
                                <div className={styles.value}>
                                  <span className={styles.bigNumber}>{(hasApprox ? '~' : '') + valueText}</span>
                                </div>
                              ) : (
                                <div className={styles.value}>
                                  <span className={styles.bigNumber}>{label || 'ROI'}</span>
                                </div>
                              )}
                              <div className={styles.label}>{valueText ? (label || 'ROI') : ''}</div>
                              {expanded && (
                                <div className={styles.roiDetails} onClick={(e) => e.stopPropagation()}>
                                  {cleaned}
                                </div>
                              )}
                            </div>
                          );
                        };

                        // Swap behavior: in Technical mode show Availability in the right panel (this section becomes Availability).
                        if (this.state && this.state.themeMode === 'Technical') {
                          try {
                            const availEntry = (Object.entries(selectedItem) as [string, unknown][]).find(([k]) => ((fieldMap[k] || '').toString().trim().toLowerCase() === 'availability'));
                            if (availEntry && availEntry[1]) {
                              // Normalize availability into an array of items, then render
                              // them as boxed cards similar to ROI cards so they match the
                              // business-mode boxed layout.
                              let items: string[] = [];
                              const raw = availEntry[1];
                              if (Array.isArray(raw)) {
                                items = (raw as any[]).map((x) => String(x).trim()).filter(Boolean);
                              } else {
                                const s = String(raw || '').trim();
                                try {
                                  const parsed = JSON.parse(s);
                                  if (Array.isArray(parsed)) items = parsed.map((x: any) => String(x).trim()).filter(Boolean);
                                  else items = s.split(/\r?\n|,|;/).map((x) => x.trim()).filter(Boolean);
                                } catch (e) {
                                  items = s.split(/\r?\n|,|;/).map((x) => x.trim()).filter(Boolean);
                                }
                              }
                              if (items.length === 0) return null;
                              return (
                                <div className={S.commentsSection}>
                                  <h4>Availability</h4>
                                  <div className={styles.expectedRoi}>
                                    {this.renderAvailabilityWithIcons(availEntry[1])}
                                  </div>
                                </div>
                              );
                            }
                          } catch (e) { /* ignore */ }
                          return null;
                        }

                        // Default (Business mode): render Expected ROI Metrics and Impact in right panel
                        return (
                          <div className={S.commentsSection}>
                            <h4>{displayLabel}</h4>
                            <div className={styles.expectedRoi}>
                              {vals && vals.length > 0 ? (
                                <div className={styles.roiCards}>
                                  {vals.map((v: string, i: number) => renderCard(v, i))}
                                </div>
                              ) : (
                                <div style={{ marginTop: 6 }}>{this.getDisplayValue(roiEntry[1])}</div>
                              )}
                              {/* Render Impact as a separate box below ROI cards (plain text, not bold) */}
                              {impactStr && (
                                <div className={styles.roiCards}>
                                  <div className={styles.roiCard}>
                                    <div style={{ textAlign: 'left', fontWeight: 'normal', fontSize: '0.95rem', color: (this.state && this.state.themeMode === 'Technical') ? '#e6e6e6' : '#0f172a' }}>{impactStr}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      } else if (impactStr) {
                        // No ROI card present — still surface Impact content alone
                        const impactLabel = (impactKey && (fieldMap[impactKey] || 'Impact')) || 'Impact';
                        return (
                          <div className={S.commentsSection}>
                            <h4>{impactLabel}</h4>
                            <div className={styles.expectedRoi}>
                              <div className={styles.roiCards}>
                                <div className={styles.roiCard}>
                                  <div style={{ textAlign: 'left', fontWeight: 'normal', fontSize: '0.95rem', color: (this.state && this.state.themeMode === 'Technical') ? '#e6e6e6' : '#0f172a' }}>{impactStr}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    } catch (e) { /* ignore */ }
                    return null;
                  })()}

                  {/* Technical-specific fields for Agents: show on right panel when Technical theme */}
                  {(() => {
                    try {
                      if (this.state && this.state.themeMode === 'Technical' && this.state.activeList === 'Agents') {
                        const targets = ['llms leveraged', 'supported hyperscalers', 'agent development framework', 'contact name'];
                        const matches = (Object.entries(selectedItem) as [string, unknown][])
                          .filter(([k]) => targets.includes(((fieldMap[k] || '').toString().trim().toLowerCase())))
                          .map(([k, v]) => ({ label: (fieldMap[k] || '').toString().trim(), value: this.getDisplayValue(v) }));
                        if (matches && matches.length > 0) {
                          return (
                            <div className={S.commentsSection} onClick={(e) => e.stopPropagation()}>
                              <h4>Technical Details</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                                {matches.map((m, idx) => (
                                  <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 700, color: (this.state && this.state.themeMode === 'Technical') ? '#9adff0' : '#0070AD' }}>{m.label}</span>
                                    <span style={{ color: (this.state && this.state.themeMode === 'Technical') ? '#e6e6e6' : '#0f172a' }}>{m.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      }
                    } catch (e) { /* ignore */ }
                    return null;
                  })()}

                  {/* Ratings (card) */}
                  <div className={S.commentsSection}>
                    <h4>Ratings</h4>
                    <div className={S.commentsRating} onClick={(e) => e.stopPropagation()}>
                      {(() => {
                        const count = Number(this.ratingCountField ? selectedItem[this.ratingCountField] : 0) || 0;
                        const avgRaw = Number(selectedItem[this.ratingAvgField || '']);
                        const avgValue = Number.isFinite(avgRaw) && !isNaN(avgRaw) ? avgRaw : 0;
                        const avgRounded = Math.round(avgValue * 10) / 10;
                        let avgDisplay: string;
                        if (!Number.isFinite(avgRounded) || isNaN(avgRounded)) {
                          avgDisplay = '0';
                        } else if (Math.abs(avgRounded - Math.round(avgRounded)) < 1e-9) {
                          avgDisplay = String(Math.round(avgRounded));
                        } else {
                          avgDisplay = avgRounded.toFixed(1);
                        }
                        const displayForStars = avgValue;
                        const listTitleForRender = this.state.activeList === "Agents" ? "Operational Excellence Agents" : "Industrialized Use cases";
                        return (
                          <>
                            <div className={S.ratingRow}>
                              <div className={S.ratingTop}>
                                <div className={S.ratingStars}>
                                  {[1,2,3,4,5].map((i) => {
                                    const left = Math.max(0, Math.min(1, (displayForStars) - (i - 1)));
                                    const fillPercent = Math.round(left * 100);
                                    return (
                                      <button
                                        key={i}
                                        type="button"
                                        className={S.starBtn}
                                        onClick={async (e) => {
  e.stopPropagation();
  this.trackEvent("rate_item", {
    buttonLabel: `star_${i}`,
    rating: i,
    itemTitle: selectedItem.Title,
    itemId: selectedItem.Id,
  });
  try { this.setLocalRatingForItem(listTitleForRender, Number(selectedItem.Id), i); } catch (err) { /* ignore */ }
  this.setState({ rawRatingPayload: `Posting rating ${i}...`, ratingError: "" });
  await this.handleRate(selectedItem, i);
}}
                                        aria-label={`Rate ${i}`}
                                      >
                                        <span className={S.starWrapper}>
                                          <span className={S.starBack}>★</span>
                                          <span className={S.starFront} style={{ width: `${fillPercent}%` }}>★</span>
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                                <div className={S.ratingSummary}>
                                  <div className={S.avgText}>{avgDisplay} / 5</div>
                                </div>
                              </div>
                              <div className={S.countTextBelow}>{count} rating{count !== 1 ? 's' : ''}</div>
                            </div>
                            {(this.state.ratingError || this.state.rawRatingPayload) && (
                              <div style={{ marginTop: 8 }}>
                                {this.state.ratingError && (
                                  <div className={S.ratingErrorBox}>{this.state.ratingError}</div>
                                )}
                                {this.state.rawRatingPayload && (
                                  <pre style={{ maxHeight: 120, overflow: 'auto', background: '#f7f7f7', padding: 8, borderRadius: 6, fontSize: 12 }}>{String(this.state.rawRatingPayload)}</pre>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
{/* Quick Links (card) */}
                  <div className={S.commentsSection}>
                    <h4>Quick Links</h4>
                    <div className={styles.quickLinks} onClick={(e) => e.stopPropagation()}>
                      {(() => {
                        const links: { key: string; label: string; url?: string; display?: string }[] = [];
                        const lf = this.getLinkFieldsForItem(selectedItem) || [];
                        lf.filter((x) => {
                          const lbl = (x.label || '').toString().trim().toLowerCase();
                          const theme = ((this.state && this.state.themeMode) || '').toString().trim().toLowerCase();
                          // Exclude demo video and Agentic links (Agentic moved to modal header)
                          // Also exclude Repository Link when in Business mode (only show in Technical)
                          return lbl !== 'demo video' && lbl !== 'agentic experience' && lbl !== 'agentic link' && !(lbl === 'repository link' && theme === 'business');
                        }).forEach((x) => links.push({ key: x.key, label: x.label || x.displayText || x.key, url: x.url, display: x.displayText }));
                        // include Sample Input File if present
                        try {
                          const sample = (Object.entries(selectedItem) as [string, unknown][]).find(([k]) => ((fieldMap[k] || '').toString().trim().toLowerCase() === 'sample input file'));
                          if (sample && sample[1]) {
                            const url = this.extractUrlFromValue(sample[1]);
                            if (url) {
                              const displayLabel = (fieldMap[sample[0]] || 'Sample Input File').toString();
                              links.push({ key: 'sample_input', label: displayLabel, url, display: displayLabel });
                            }
                          }
                        } catch (e) { /* ignore */ }

                         return links.map((l) => {
                          console.log("Quick link:", l.label, l.url);
                          const isTechnical = (this.state && this.state.themeMode === 'Technical');
                          const displayText = isTechnical && l.label && /pitch\s*-?\s*deck/i.test(l.label) ? 'Pitch/Architecture Deck' : (l.display || l.label);
                          return (
                            <button
                                key={l.key}
                                type="button"
                                className={l.url ? styles.linkButton : styles.linkButtonDisabled}
                                disabled={!l.url}
                                onClick={(ev) => {
                                  ev.preventDefault();
                                  ev.stopPropagation();
                                  ev.nativeEvent.stopImmediatePropagation();
                                  console.log("Link Label:", l.label);
                                  console.log("URL:", l.url);
                                  if (!l.url) {
                                    return;
                                  }

                                  window.open(
                                    l.url,
                                    "_blank",
                                    "noopener,noreferrer"
                                  );

                                  this.trackEvent("link_icon_click", {
                                    buttonLabel: l.label,
                                    url: l.url,
                                    itemTitle: selectedItem.Title,
                                    itemId: selectedItem.Id
                                  });
                                }}
                              >
                                {this.renderIconForField(l.label || '', !!l.url)}
                                <span style={{ flex: 1, textAlign: 'left' }}>
                                  {displayText}
                                </span>
                              </button>
                          );
                        });
                      })()}
                    </div>
                    
                  </div>

                  {/* Comments (card) - collapsible so users must click to view/post */}
                  <div className={S.commentsSection} onClick={(e) => e.stopPropagation()}>
                    <div className={S.commentsHeader} role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); this.toggleComments(); }} aria-expanded={!this.state.commentsCollapsed}>
                      <h4>Comments</h4>
                      <button
                        type="button"
                        className={S.commentToggle}
                        onClick={(e) => { e.stopPropagation(); this.toggleComments(); }}
                        aria-label={this.state.commentsCollapsed ? 'Expand comments' : 'Collapse comments'}
                        aria-expanded={!this.state.commentsCollapsed}
                      >
                        {this.state.commentsCollapsed ? '▾' : '▴'}
                      </button>
                    </div>
                    {!this.state.commentsCollapsed && (
                      <>
                        {commentError && <div className={S.commentError}>{commentError}</div>}
                        <div className={S.commentsBody}>
                          <div className={S.commentsList}>
                            {(commentsByItem && commentsByItem[Number(selectedItem.Id)] && commentsByItem[Number(selectedItem.Id)].length > 0) ? (
                              commentsByItem[Number(selectedItem.Id)].map((c, i) => (
                                <div key={i} className={S.commentItem}>
                                  <div className={S.commentMeta}>
                                    <span className={S.commentAuthor}>{c.author}</span>
                                    <span className={S.commentDate}>{this.formatRelativeDate(c.created)}</span>
                                  </div>
                                  <div className={S.commentText}>{c.text}</div>
                                </div>
                              ))
                            ) : (
                              <div className={S.noComments}>No comments yet</div>
                            )}
                          </div>

                          <div className={S.commentInputArea}>
                            <textarea
                              value={commentInput}
                              onChange={(e) => this.setState({ commentInput: e.target.value })}
                              placeholder="Write a comment..."
                              className={S.commentInput}
                              rows={3}
                            />
                            <button
                              className={S.commentButton}
                              onClick={async () => {
    const listTitle =
      activeList === "Agents"
        ? "Operational Excellence Agents"
        : "Industrialized Use cases";
    this.trackEvent("post_comment", {
      buttonLabel: "Post",
      itemTitle: selectedItem.Title,
      itemId: selectedItem.Id,
    });
    await this.postComment(listTitle, Number(selectedItem.Id), commentInput);
  }}
                              disabled={commentPosting || !commentInput.trim()}
                            >
                              {commentPosting ? "Posting..." : "Post"}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {this.state.showContact && (
          <div className={styles.modalOverlay} onClick={this.closeContact}>
            <div
              className={`${styles.modalContent} ${S.contactModalContent}`}
              onClick={(e) => e.stopPropagation()}
              tabIndex={0}
            >
              <button
                className={styles.closeButton}
                onClick={this.closeContact}
                aria-label="Close"
                type="button"
              >
                &times;
              </button>
              <h2>Contact us</h2>
              <div className={styles.modalScrollArea}>             
                <p>Reach out to us for more information on {"<DL>"} and we will get back to you at the earliest</p>
                <ul>
                  {this.contactEmails.map((email) => {
                    const e = email.trim();
                    return (
                      <li key={e} style={{ marginBottom: 8 }}>
                        <a
                          href={`mailto:${encodeURIComponent(e)}?subject=${encodeURIComponent("Contact from Marketplace")}`}
                          onClick={() => {
  this.trackEvent("contact_email_click", {
    buttonLabel: "Contact Email",
    email: e,
  });
  this.closeContact();
}}
                          className={styles.link}
                        >
                          {e}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

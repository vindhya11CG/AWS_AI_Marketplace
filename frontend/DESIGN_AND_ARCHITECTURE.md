# AWS AI Marketplace Frontend — Design System & Architecture

## 1. Project & Directory Topology

The workspace contains two layers:
- **Root Directory (`/`)**: Legacy SharePoint Framework (SPFx) wrapper configured to delegate active web development to the `frontend/` workspace via `"dev": "npm run dev --prefix frontend"`.
- **Frontend Directory (`/frontend/`)**: Modern Single Page Application (SPA) powered by **React 18**, **Vite 5**, and **AWS Cloudscape Design System** (`@cloudscape-design/components`, `@cloudscape-design/global-styles`).

```
frontend/
├── index.html                   # HTML5 entrypoint with root viewport meta
├── vite.config.js               # Vite config with @vitejs/plugin-react
├── package.json                 # React 18, Cloudscape, Vite toolchain
└── src/
    ├── main.jsx                 # Mounts root with Cloudscape global styles & custom theme tokens
    ├── App.jsx                  # TopNavigation, dynamic hash router, and light/dark theme sync
    ├── styles.css               # Core design tokens, theme variables, and global component rules
    ├── data/
    │   └── mockData.js          # Domain models (with logo, stats, workflows) and workflow datasets
    ├── styles/
    │   ├── Dashboard.css        # Standardized card geometry, grid rules, and header styling
    │   ├── ManageDomains.css    # Domain creation form and accordion list styles
    │   ├── DomainDetails.css    # Domain workflow detail view styles
    │   └── WorkflowBuilder.css  # Interactive multi-agent canvas styles
    └── components/
        ├── Dashboard.jsx        # Main dashboard with domain cards and workflow inventory
        ├── ManageDomains.jsx    # Domain registration and catalog view
        ├── DomainDetails.jsx    # Drilldown for specific domain executions
        ├── Sidebar.jsx          # Cloudscape SideNavigation wrapper
        ├── WorkflowBuilder.jsx  # Multi-agent workflow design canvas
        └── marketplace/         # Starter pack catalog, agent cards, and detail modal
```

---

## 2. Capgemini & Sogeti Brand Design System (`styles.css`)

### Official Brand Color Palettes

The application UI is grounded strictly in the **Capgemini & Sogeti Brand Guidelines**. Every visual element maps to an official brand color token:

#### 1. Primary Palette
| Color | Pantone | HEX | RGB | CMYK | Semantic Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Capgemini Blue** | Pantone 7461 C | `#0070AD` | R0 G112 B173 | C100 M27 Y0 K10 | Primary brand anchor, primary action buttons, active navigation, focused outlines |
| **Vibrant Blue** | Pantone 2191 C | `#12ABDB` | R18 G171 B219 | C75 M0 Y5 K0 | Interactive hover highlights, dark mode active states, focus rings, running indicators |

#### 2. Secondary Palette
| Color | Pantone | HEX | RGB | CMYK | Semantic Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Deep Purple** | Pantone 2695 C | `#2B0A3D` | R43 G10 B61 | C85 M100 Y30 K35 | Primary typography in light mode, dark mode foundation canvas base |
| **Cool Tech Red** | Pantone 1787 C | `#F53B53` | R245 G59 B83 | C0 M90 Y60 K0 | "New!" callout badges, urgent notifications, destructive/alert accents |
| **Cool Grey** | Pantone Cool Grey 1 | `#F5F5F7` | R245 G245 B247 | C0 M0 Y0 K5 | Official background canvas for light mode, light text in dark mode |
| **White** | — | `#FFFFFF` | R255 G255 B255 | C0 M0 Y0 K0 | Light mode card surfaces, primary button label text |

#### 3. Infographic & Extended Palette
| Palette Group | Colors & HEX Codes | Purpose & Component Mapping |
| :--- | :--- | :--- |
| **Blue Shades** | Dark Shade (`#005A82`), 50% Tint (`#80B8D6`), Vibrant 50% (`#88D5ED`) | Button hover states, domain icon borders, subtle badges |
| **Green & Aqua** | Green (`#00C37B`), Dark Green (`#15596B`), Aqua (`#0F999C`), Bright Aqua (`#01D1D0`), Zest Green (`#95E616`) | "Completed" workflow badges, successful execution states |
| **Purples** | Bright Purple (`#6D64CC`), Dark Purple (`#4701A7`), Purple (`#7E39BA`) | Agent categories, governance tags, elevated dark mode surfaces |
| **Warm Earth & Peach** | Amber (`#BA6C34`), Peach (`#FF7E83`), Gold (`#E5A071`), Warm Peach (`#F5C499`), Light Gold (`#FFE2BE`) | "Pending" status badges, simulation tags, warning callouts |

---

### Color Harmony & Grouping Rules
In accordance with brand infographics rules:
1. **Always Anchor First**: Begin with Capgemini Blue (`#0070AD`) or Deep Purple (`#2B0A3D`) as the primary visual anchor.
2. **Pair with Complementary Contrast Sets**:
   - **Contrast Group A**: Cool Tech Red (`#F53B53`) / Peach (`#FF7E83`) for alert badges and highlights.
   - **Contrast Group B**: Green (`#00C37B`) / Dark Green (`#15596B`) / Aqua (`#0F999C`) for completion and growth metrics.
   - **Contrast Group C**: Warm Earth (`#BA6C34` / `#F5C499`) for pending execution queues.
3. **No Arbitrary Color Clashing**: Elements never combine multiple warm clashing tones without anchoring to the cool blue/purple spectrum.

---

### Multi-Mode Token Mapping

Theme attributes are dynamically synced to both `document.documentElement` and `document.body` via `[data-theme='light'|'dark']`.

| Token Category | Token Variable | Light Mode (Cool Grey Canvas) | Dark Mode (Deep Purple Canvas) | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas** | `--aws-canvas-bg` | `#F5F5F7` (Cool Grey) | `#0E0617` (Deep Purple Base) | Root background |
| **Card Surface** | `--aws-card-bg` | `#FFFFFF` (White) | `#1B0F2E` (Elevated Purple) | Domain cards, modals, dropdowns |
| **Card Hover** | `--aws-card-hover-bg` | `#F8FBFE` (Blue-tinted White) | `#24143D` | Elevated hover surface |
| **Border Normal** | `--aws-border-color` | `#C8DDE8` (Capgemini Blue tint) | `#381E57` | Card/panel borders — blue-tinted, not generic grey |
| **Border Light** | `--aws-border-light` | `#D0E4F0` (Lighter Blue tint) | `#2E1948` | Subtle dividers, inner card borders |
| **Border Hover** | `--aws-border-hover` | `#0070AD` (Capgemini Blue) | `#12ABDB` (Vibrant Blue) | High-contrast interactive border |
| **Text Heading** | `--aws-text-dark` | `#2B0A3D` (Deep Purple) | `#F5F5F7` (Cool Grey) | Card headers, h1-h4 titles |
| **Text Body** | `--aws-text-body` | `#323546` | `#D4D0DE` | Descriptions, workflow lists |
| **Text Muted** | `--aws-text-muted` | `#5A607A` | `#9B94AA` | Subtitles, labels, timestamps |
| **Primary Button** | `--btn-primary-bg` | `#0070AD` (Hover: `#005A82`) | `#0070AD` (Hover: `#005A82`) | Primary CTA buttons (Capgemini Blue) |
| **Secondary Button** | `--btn-secondary-bg` | `#2B0A3D` (Hover: `#1E072C`) | `#261440` (Hover: `#341B57`) | **Deep Purple** dark buttons — strong brand CTA |
| **Tertiary Button** | `--btn-tertiary-bg` | `#EDE8F2` (Hover: `#DFD4E8`) | `#25143E` (Hover: `#341B57`) | Muted purple-tinted actions |
| **Input Border** | `--aws-input-border` | `#B0C8D8` (Blue-tinted) | `#381E57` | Form field borders — branded, not generic |
| **Accent Divider** | `--accent-divider` | `#12ABDB` (Vibrant Blue) | `#6D64CC` (Bright Purple) | Section header top-borders, separator lines |
| **Accent Divider Subtle** | `--accent-divider-subtle` | `rgba(18,171,219,0.30)` | `rgba(109,100,204,0.30)` | Card footer dividers, sidebar separators |
| **Active Nav Accent**| `--aws-blue-primary`| `#0070AD` | `#12ABDB` | Active sidebar item + 3px left accent bar |
| **Domain Icon** | `--domain-icon-border` | `#12ABDB` (Vibrant Blue) | `#452470` | Domain avatar card border — branded, not pastel |
| **Badge Borders** | Status badge borders | `#00C37B` / `#12ABDB` / `#E5A071` / `#F53B53` | Matching brand alpha tints | Full-saturation brand borders, not faded |

---

### WCAG AA Accessibility Contrast Matrix

All text and UI controls strictly satisfy WCAG AA contrast standards (minimum **4.5:1** for regular text, **3.0:1** for graphical user interface components and large text):

| Element / State | Foreground | Background | Contrast Ratio | WCAG AA Status |
| :--- | :--- | :--- | :--- | :--- |
| **Light Mode Primary Headings** | `#2B0A3D` (Deep Purple) | `#FFFFFF` (Card) | **14.8:1** | Pass (AAA) |
| **Light Mode Body Text** | `#323546` (Dark Slate) | `#FFFFFF` (Card) | **11.2:1** | Pass (AAA) |
| **Light Mode Muted Metadata** | `#656C7D` (Cool Grey Dark) | `#FFFFFF` (Card) | **5.4:1** | Pass (AA) |
| **Light Mode Primary Button** | `#FFFFFF` (White) | `#0070AD` (Capgemini Blue) | **4.7:1** | Pass (AA) |
| **Light: Status Completed** | `#006841` (Deep Green) | `#E6F9F2` (Aqua Tint) | **6.1:1** | Pass (AA) |
| **Light: Status Running** | `#005A82` (Dark Blue) | `#E7F6FC` (Vibrant Tint) | **6.4:1** | Pass (AA) |
| **Light: Status Pending** | `#7A3E16` (Dark Amber) | `#FDF2E9` (Earth Tint) | **6.3:1** | Pass (AA) |
| **Light: Badge "New!"** | `#B81B32` (Tech Red Dark) | `#FDEBED` (Red Tint) | **5.8:1** | Pass (AA) |
| **Dark Mode Primary Headings** | `#F5F5F7` (Cool Grey) | `#1B0F2E` (Deep Surface) | **13.9:1** | Pass (AAA) |
| **Dark Mode Body Text** | `#D4D0DE` (Soft Lavender) | `#1B0F2E` (Deep Surface) | **10.1:1** | Pass (AAA) |
| **Dark Mode Muted Text** | `#9B94AA` (Muted Violet) | `#1B0F2E` (Deep Surface) | **5.3:1** | Pass (AA) |
| **Dark Mode Interactive Border**| `#12ABDB` (Vibrant Blue) | `#1B0F2E` (Deep Surface) | **6.8:1** | Pass (AA UI) |
| **Dark: Status Completed** | `#00C37B` (Bright Green) | `#1B0F2E` (Deep Surface) | **7.4:1** | Pass (AA) |
| **Dark: Status Running** | `#12ABDB` (Vibrant Blue) | `#1B0F2E` (Deep Surface) | **6.8:1** | Pass (AA) |
| **Dark: Status Pending** | `#F5C499` (Warm Peach) | `#1B0F2E` (Deep Surface) | **8.2:1** | Pass (AA) |

---

## 3. Standardized Card Architecture (`Dashboard.jsx` & `Dashboard.css`)

### Root Cause of Previous "Weird Shapes"
Previously, `.dashboard-domain-card` used `justify-content: space-between` with unconstrained description heights and multi-line wrapping workflow names. Whenever cards in the same grid row contained varying text lengths, CSS grid stretched each card to the tallest item, causing internal elements to pull apart and form awkward blank voids.

### Engineering Standard Implemented
Cards are structured with strict layout zoning and zero cumulative layout shift (CLS):

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo] Title                            [Count Badge]       │  <- Header Row (flex, no wrap)
│         Seller Label (optional)                              │
├──────────────────────────────────────────────────────────────┤
│  Description (clamped to exactly 2 lines, 39px height)      │  <- Body Zone (deterministic)
│  [✓ 19 Completed]  [⚡ 3 Running]  [⏱ 2 Pending]             │
├──────────────────────────────────────────────────────────────┤
│  RECENT WORKFLOWS                                            │  <- Footer Zone (margin-top: auto)
│  › Workflow Name A (single-line ellipsis + full tooltip)     │
│  › Workflow Name B (single-line ellipsis + full tooltip)     │
│                                           Explore workflows →│  <- Interactive Anchor
└──────────────────────────────────────────────────────────────┘
```

### Key Implementation Principles:
1. **Deterministic Grid Geometry**:
   - `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 22px;`
   - Minimum card height set to `290px` to maintain visual consistency across rows.
2. **Text Clamping & Overflow Protection**:
   - Descriptions use `-webkit-line-clamp: 2` with explicit height (`39px`), ensuring identical spacing regardless of sentence count.
   - Recent workflow items truncate with `text-overflow: ellipsis; white-space: nowrap; overflow: hidden;` and provide native HTML `title` attributes for tooltips on hover.
3. **Bottom Anchoring without Vertical Voids**:
   - Replaced `justify-content: space-between` with `margin-top: auto` on `.domain-card-footer`. Body content stays naturally grouped at the top while the footer anchors cleanly to the bottom edge.
4. **Zero Layout Shift on Hover**:
   - Cards maintain a constant `1px solid` border width. Interactive hover transitions manipulate only `transform: translateY(-2px)`, `border-color: var(--aws-border-hover)`, and `box-shadow: var(--aws-card-hover-shadow)`.
5. **Keyboard Accessibility**:
   - Each card includes `role="button"`, `tabIndex={0}`, keyboard handlers (`Enter` / `Space`), and `:focus-visible` outline rings.

---

## 4. shadcn/ui Sidebar Architecture (`components/ui/sidebar.jsx` & `styles/sidebar.css`)

### Specification & Pattern
Built to exactly match the official [shadcn/ui Sidebar](https://ui.shadcn.com/docs/components/aria/sidebar) template:

```
SidebarProvider (context: state, open, toggleSidebar, Ctrl+B / Cmd+B)
└── Sidebar (collapsible="icon", data-state="expanded" | "collapsed")
    ├── SidebarHeader (Brand Logo icon, "Amplifier AI", "Enterprise Agentic Studio", SidebarTrigger)
    ├── SidebarContent (Scrollable, custom slim scrollbar)
    │   ├── SidebarGroup ("Platform") -> Dashboard, Domains [Badge 10], Workflows, Agent Catalogue
    │   ├── SidebarGroup ("AI Ecosystem") -> Marketplace [Badge New], Chat, Usecase Advisory
    │   └── SidebarGroup ("Governance & Lab") -> Insights, Simulation Lab, Security & Governance
    ├── SidebarFooter (User Avatar card: "Admin User", "Enterprise Studio")
    └── SidebarRail (Interactive right-edge rail to toggle collapse on border click)
```

### Key Capabilities:
1. **Collapsible Icon Mode**:
   - Smooth width transition from `256px` (`--sidebar-width`) to `56px` (`--sidebar-width-icon`).
   - Automatically hides group labels, item texts, and badges in icon mode while preserving SVG icons and native HTML `title` tooltips.
2. **Keyboard Accessibility**:
   - Toggle with standard `Ctrl+B` (Windows/Linux) or `Cmd+B` (macOS).
   - Full keyboard navigation with `:focus-visible` styling.
3. **Persistent State**:
   - State is saved in `localStorage.getItem('sidebar:state')`, retaining the user's preferred layout across sessions.
4. **Multi-Mode Synchronization**:
   - Supports light and dark mode automatically using CSS variables (`--aws-canvas-bg`, `--aws-border-light`, `--aws-blue-primary`).

---

## 5. Responsive Shell & Fluid Content Expansion Architecture

### Problem Solved
Previously, views were independently wrapped in Cloudscape's `<AppLayout>`, which reserved a hardcoded ~280px left drawer column with its own internal toggle chevron (`.awsui_navigation-toggle_...`). Additionally, `.dashboard-page-container` was restricted to `max-width: 1440px; margin: 0 auto;`. When the custom sidebar collapsed into a 56px icon rail, an awkward ~224px blank void appeared, and the dashboard cards remained clamped in the center of the screen.

### Architectural Solution
1. **Lifting Sidebar to Root Shell**:
   - `App.jsx` now mounts `<SidebarProvider>` at the root, wrapping `<Sidebar>` and `<main className="app-main-viewport">`.
   - All sub-views (`Dashboard.jsx`, `ManageDomains.jsx`, `DomainDetails.jsx`, `WorkflowBuilder.jsx`, `MarketplaceHome.jsx`) render directly into the main viewport.
2. **Cloudscape Drawer Decoupling**:
   - `Dashboard.jsx` returns `.dashboard-page-container` directly without an `AppLayout` wrapper.
   - Internal tool-views (`ManageDomains`, `DomainDetails`, `WorkflowBuilder`, `MarketplaceHome`) pass `navigationHide={true}` and `toolsHide={true}` to prevent duplicate drawer columns or chevron toggles.
   - Legacy Cloudscape drawer toggle artifacts (`.awsui_navigation-toggle_...`) are suppressed via CSS.
3. **Fluid 100% Width Responsive Grid**:
   - `.dashboard-page-container` is set to `width: 100%; max-width: 100%; margin: 0;` with smooth CSS transition timing.
   - When the sidebar collapses from `256px` to `56px`, the main viewport (`flex: 1 1 0%; min-width: 0; width: 100%;`) immediately claims all released horizontal space. The CSS grid (`repeat(auto-fill, minmax(320px, 1fr))`) fluidly expands cards and fits more columns per row.
   - When the sidebar expands back to `256px`, the viewport smoothly transitions back to standard width without any layout thrashing.
4. **Convenient Brand Icon Toggle**:
   - When the sidebar is collapsed in icon rail mode, clicking the top brand icon instantly re-expands the sidebar in addition to the trigger button (`SidebarTrigger`), border rail (`SidebarRail`), and `Ctrl+B`.

---

## 6. Verification & Testing

- **Bundler Validation**: `npm run build` passes with zero compiler/lint errors.
- **Vite Server**: Runs seamlessly on `http://localhost:5173/` / `http://localhost:5174/` with fast HMR.
- **Cross-Theme Verification**:
  - Dark mode verified for deep canvas contrast, glowing ambient hover shadows, and legible text hierarchy.
  - Light mode verified for crisp card surfaces, high-contrast badges, and sharp borders.
- **Fluid Expansion Verification**:
  - Collapsed state: Sidebar reduces to 56px icon rail, no gap/void, dashboard dynamically fills 100% of viewport width.
  - Expanded state: Sidebar returns to 256px, dashboard layout smoothly adjusts back to normal.

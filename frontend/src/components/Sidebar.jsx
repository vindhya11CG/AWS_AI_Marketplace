import React, { useContext } from 'react'
import {
  SidebarContext,
  SidebarProvider,
  useSidebar,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarFooter,
  SidebarRail,
  SidebarTrigger,
} from './ui/sidebar'
import '../styles/sidebar.css'

// SVG Icons matching Lucide / shadcn style
const Icons = {
  LayoutDashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  ),
  Layers: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 12.5-8.58 3.91a2 2 0 0 1-1.66 0L2 12.5" />
      <path d="m22 17.5-8.58 3.91a2 2 0 0 1-1.66 0L2 17.5" />
    </svg>
  ),
  GitBranch: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  ),
  Bot: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  ),
  MessageSquare: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Compass: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  ),
  LineChart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  ),
  FlaskConical: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2v7.31a2 2 0 0 1-.37 1.17L4.17 19.3A2 2 0 0 0 5.76 22h12.48a2 2 0 0 0 1.59-2.7l-5.46-8.82A2 2 0 0 1 14 9.31V2" />
      <path d="M8.5 2h7" />
      <path d="M7 16h10" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  BrandLogo: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
}

export default function SidebarNavigation({ activeHref = '#/dashboard', onNavigate }) {
  const groups = [
    {
      title: 'Platform',
      items: [
        {
          text: 'Dashboard',
          href: '#/dashboard',
          icon: Icons.LayoutDashboard,
        },
        {
          text: 'Domains',
          href: '#/domains',
          icon: Icons.Layers,
          badge: '10',
        },
        {
          text: 'Workflows',
          href: '#/workflows',
          icon: Icons.GitBranch,
        },
        {
          text: 'Agent Catalogue',
          href: '#/agent-catalogue',
          icon: Icons.Bot,
        },
      ],
    },
    {
      title: 'AI Ecosystem',
      items: [
        {
          text: 'Marketplace',
          href: '#/marketplace',
          icon: Icons.Sparkles,
          badge: 'New',
          badgeClass: 'badge-new',
        },
        {
          text: 'Chat',
          href: '#/chat',
          icon: Icons.MessageSquare,
        },
        {
          text: 'Usecase Advisory',
          href: '#/usecase-advisory',
          icon: Icons.Compass,
        },
      ],
    },
    {
      title: 'Governance & Lab',
      items: [
        {
          text: 'Insights',
          href: '#/insights',
          icon: Icons.LineChart,
        },
        {
          text: 'Simulation Lab',
          href: '#/simulation-lab',
          icon: Icons.FlaskConical,
        },
        {
          text: 'Security & Governance',
          href: '#/security',
          icon: Icons.ShieldCheck,
        },
      ],
    },
  ]

  const handleItemClick = (href) => {
    if (onNavigate) {
      onNavigate(href)
    } else {
      window.location.hash = href
    }
  }

  const existingContext = useContext(SidebarContext)

  const renderContent = (
    <SidebarInnerContent
      activeHref={activeHref}
      handleItemClick={handleItemClick}
      groups={groups}
      Icons={Icons}
    />
  )

  if (existingContext) {
    return renderContent
  }

  return (
    <SidebarProvider defaultOpen={true}>
      {renderContent}
    </SidebarProvider>
  )
}

function SidebarInnerContent({ activeHref, handleItemClick, groups, Icons }) {
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const handleBrandClick = () => {
    if (isCollapsed) {
      toggleSidebar()
    } else {
      handleItemClick('#/dashboard')
    }
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      {/* Workspace / Brand Header */}
      <SidebarHeader>
        <button
          type="button"
          className="sidebar-brand-box"
          onClick={handleBrandClick}
          title={isCollapsed ? "Expand Sidebar (Ctrl+B)" : "Amplifier for Agentic AI"}
          aria-label={isCollapsed ? "Expand Sidebar" : "Go to Dashboard"}
        >
          <div className="sidebar-brand-icon">
            <Icons.BrandLogo />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">Amplifier AI</span>
            <span className="sidebar-brand-subtitle">Enterprise Agentic Studio</span>
          </div>
        </button>
        <SidebarTrigger />
      </SidebarHeader>

      {/* Navigation Content with Semantic Groups */}
      <SidebarContent>
        {groups.map((group, groupIdx) => (
          <SidebarGroup key={groupIdx}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item, itemIdx) => {
                  const isActive =
                    activeHref === item.href ||
                    (item.href === '#/domains' && activeHref.startsWith('#/domain')) ||
                    (item.href === '#/workflows' && activeHref.startsWith('#/workflow'))

                  const IconComponent = item.icon

                  return (
                    <SidebarMenuItem key={itemIdx}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.text}
                        onClick={() => handleItemClick(item.href)}
                      >
                        <span className="menu-item-icon">
                          <IconComponent />
                        </span>
                        <span className="menu-item-text">{item.text}</span>
                        {item.badge && (
                          <SidebarMenuBadge className={item.badgeClass || ''}>
                            {item.badge}
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer: User Profile & Status */}
      <SidebarFooter>
        <div className="sidebar-user-card" title="admin@enterprise.ai">
          <div className="sidebar-user-avatar">AI</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">Admin User</span>
            <span className="sidebar-user-role">Enterprise Studio</span>
          </div>
        </div>
      </SidebarFooter>

      {/* Interactive Border Rail to toggle on border click */}
      <SidebarRail />
    </Sidebar>
  )
}

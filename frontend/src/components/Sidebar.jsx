import React from 'react'
import { SideNavigation } from '@cloudscape-design/components'

/**
 * Sidebar component - Main navigation menu
 * @component
 * @param {string} activeHref - Currently active navigation link
 * @param {Function} onNavigate - Callback when navigation item is clicked
 * @returns {React.ReactElement} - Rendered sidebar navigation
 */
export default function Sidebar({ activeHref, onNavigate }) {
  const navigationItems = [
    { type: 'link', text: 'Dashboard', href: '#/dashboard' },
    { type: 'link', text: 'Domains', href: '#/domains' },
    { type: 'link', text: 'Workflows', href: '#/workflows' },
    { type: 'link', text: 'Agent Catalogue', href: '#/agent-catalogue' },
    { type: 'link', text: 'Chat', href: '#/chat' },
    { type: 'link', text: 'Usecase Advisory', href: '#/usecase-advisory' },
    { type: 'link', text: 'Marketplace', href: '#/marketplace' },
    { type: 'link', text: 'Insights', href: '#/insights' },
    { type: 'link', text: 'Simulation Lab', href: '#/simulation-lab' },
    { type: 'link', text: 'Security & Governance', href: '#/security' },
  ]

  return (
    <SideNavigation
      activeHref={activeHref}
      header={{ href: '#/', text: 'Sogeti' }}
      onFollow={(event) => onNavigate(event.detail.href)}
      items={navigationItems}
    />
  )
}

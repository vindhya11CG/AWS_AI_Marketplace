import React, { useState, useEffect } from 'react'
import { TopNavigation, Toggle } from '@cloudscape-design/components'
import { applyMode, Mode } from '@cloudscape-design/global-styles'
import Dashboard from './components/Dashboard'
import ManageDomains from './components/ManageDomains'
import DomainDetails from './components/DomainDetails'
import WorkflowBuilder from './components/WorkflowBuilder'
import MarketplaceHome from './components/marketplace/MarketplaceHome'
import { SidebarProvider } from './components/ui/sidebar'
import Sidebar from './components/Sidebar'
import { initialDomains, initialWorkflows } from './data/mockData'

export default function App() {
  const [domains, setDomains] = useState(initialDomains)
  const [workflows, setWorkflows] = useState(initialWorkflows)
  const [currentRoute, setCurrentRoute] = useState('#/dashboard')
  const [selectedDomain, setSelectedDomain] = useState(null)
  
  // Theme state: defaults to 'dark' mode as requested
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app_theme')
    return saved || 'dark'
  })

  // Apply theme to DOM and Cloudscape
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('app_theme', theme)
    try {
      applyMode(theme === 'dark' ? Mode.Dark : Mode.Light)
    } catch (e) {
      console.warn('Error applying cloudscape mode:', e)
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  // Listen to hash change for browser navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/dashboard'
      setCurrentRoute(hash)
    }

    if (window.location.hash) {
      setCurrentRoute(window.location.hash)
    } else {
      window.location.hash = '#/dashboard'
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleNavigate = (href) => {
    window.location.hash = href
    setCurrentRoute(href)
    window.scrollTo(0, 0)
  }

  const handleSelectDomain = (domain) => {
    setSelectedDomain(domain)
    handleNavigate('#/domain-details')
  }

  const handleNavigateToBuilder = (domain = null) => {
    setSelectedDomain(domain)
    handleNavigate('#/workflows')
  }

  const handleAddDomain = (newDomain) => {
    setDomains((prev) => [newDomain, ...prev])
  }

  const handleAddWorkflow = (newWf) => {
    setWorkflows((prev) => [newWf, ...prev])
    setDomains((prev) =>
      prev.map((d) => {
        if (d.id === newWf.domainId || d.title.toLowerCase() === newWf.domain.toLowerCase()) {
          return {
            ...d,
            workflowCount: (d.workflowCount || 0) + 1,
            stats: {
              ...d.stats,
              pending: (d.stats?.pending || 0) + 1,
            },
            recentWorkflows: [newWf.name, ...(d.recentWorkflows || [])].slice(0, 3),
          }
        }
        return d
      })
    )
  }

  const renderCurrentView = () => {
    if (currentRoute.startsWith('#/domains') || currentRoute === '#/domain-management') {
      return (
        <ManageDomains
          domains={domains}
          onAddDomain={handleAddDomain}
          onSelectDomain={handleSelectDomain}
          activeHref="#/domains"
          onNavigate={handleNavigate}
        />
      )
    }

    if (currentRoute.startsWith('#/domain-details')) {
      return (
        <DomainDetails
          domain={selectedDomain || domains[0]}
          workflows={workflows}
          activeHref="#/domains"
          onNavigate={handleNavigate}
          onNavigateToBuilder={handleNavigateToBuilder}
        />
      )
    }

    if (
      currentRoute.startsWith('#/workflows') ||
      currentRoute.startsWith('#/workflow-builder') ||
      currentRoute.startsWith('#/create-workflow')
    ) {
      return (
        <WorkflowBuilder
          domains={domains}
          initialDomain={selectedDomain}
          onAddWorkflow={handleAddWorkflow}
          activeHref="#/workflows"
          onNavigate={handleNavigate}
        />
      )
    }

    if (currentRoute.startsWith('#/marketplace')) {
      return (
        <MarketplaceHome
          activeHref="#/marketplace"
          onNavigate={handleNavigate}
        />
      )
    }

    // Default: Dashboard
    return (
      <Dashboard
        domains={domains}
        workflows={workflows}
        activeHref="#/dashboard"
        onNavigate={handleNavigate}
        onSelectDomain={handleSelectDomain}
      />
    )
  }

  return (
    <div className={`theme-root ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <TopNavigation
          identity={{
            title: 'Amplifier for Agentic AI',
            href: '#/dashboard',
            onFollow: () => handleNavigate('#/dashboard'),
          }}
          utilities={[{
            type: 'button',
            text: 'Log Out',
          }]} 
        />
        <Toggle
          onChange={() => toggleTheme()}
          checked={theme === 'dark'}
        >
          <span style={{ color: 'var(--color-text-body-default)' }}>
            {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </span>
        </Toggle>
      </div>
      <SidebarProvider defaultOpen={true}>
        <div className="app-shell-container">
          <Sidebar activeHref={currentRoute} onNavigate={handleNavigate} />
          <main className="app-main-viewport">
            {renderCurrentView()}
          </main>
        </div>
      </SidebarProvider>
    </div>
  )
}

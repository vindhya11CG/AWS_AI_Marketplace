import React, { useState, useEffect } from 'react'
import { TopNavigation } from '@cloudscape-design/components'
import Dashboard from './components/Dashboard'
import ManageDomains from './components/ManageDomains'
import DomainDetails from './components/DomainDetails'
import WorkflowBuilder from './components/WorkflowBuilder'
import MarketplaceHome from './components/marketplace/MarketplaceHome'
import { initialDomains, initialWorkflows } from './data/mockData'

export default function App() {
  const [domains, setDomains] = useState(initialDomains)
  const [workflows, setWorkflows] = useState(initialWorkflows)
  const [currentRoute, setCurrentRoute] = useState('#/dashboard')
  const [selectedDomain, setSelectedDomain] = useState(null)

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
    // Increment domain workflow count
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
    <div>
      <TopNavigation
        identity={{
          title: 'Amplifier for Agentic AI',
          href: '#/dashboard',
          onFollow: () => handleNavigate('#/dashboard'),
        }}
        utilities={[
          {
            type: 'button',
            text: 'Log Out',
          },
        ]}
      />
      {renderCurrentView()}
    </div>
  )
}

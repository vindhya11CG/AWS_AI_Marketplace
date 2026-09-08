import React, { useState } from 'react'
import {
  ButtonDropdown,
  SpaceBetween,
  Table,
  Pagination,
} from '@cloudscape-design/components'
import '../styles/Dashboard.css'

const mockDomains = [
  {
    id: 1,
    title: 'Manufacturing',
    logo: '🏭',
    workflowCount: 28,
    description: 'Enhance manufacturing efficiency through optimized production lines and quality control systems.',
    stats: { completed: 19, running: 3, pending: 2 },
    recentWorkflows: [
      'IntelliWork - Intelligent Work Order & Resolution Adherence Agent',
      'Design_Document_QC_Check_Manufacturing',
    ],
  },
  {
    id: 2,
    title: 'Finance & Insurance',
    logo: '💰',
    workflowCount: 64,
    description: 'Streamline financial operations with risk assessment, fraud detection, and compliance monitoring.',
    stats: { completed: 48, running: 8, pending: 8 },
    recentWorkflows: [
      'Delhi Travel Budget Planning',
      'Invoice Processing Automation',
    ],
  },
  {
    id: 3,
    title: 'Healthcare',
    logo: '🏥',
    workflowCount: 99,
    description: 'A comprehensive multi-agent system for managing medical insurance policies, payments, claims, and reporting.',
    stats: { completed: 71, running: 8, pending: 12 },
    recentWorkflows: [
      'Clinical Documentation Efficiency Enhancement',
      'Healthcare Cyber Risk Mitigation',
    ],
  },
  {
    id: 4,
    title: 'SDLC',
    logo: '⚙️',
    workflowCount: 39,
    description: 'A Multi-Agent System framework to streamline and optimize the Software Development Life Cycle, from requirement to deployment.',
    stats: { completed: 30, running: 4, pending: 5 },
    recentWorkflows: [
      'SDLC Requirements Clarification Workflow',
      'Test Workflow',
    ],
  },
  {
    id: 5,
    title: 'Public Sector Services & Governance',
    logo: '🏛️',
    workflowCount: 8,
    description: 'Covers government-owned organizations providing essential public services like healthcare, education, and transportation.',
    stats: { completed: 6, running: 1, pending: 1 },
    recentWorkflows: [
      'Metropolitan Traffic Reduction Plan',
      'Govt Approval Application Automation',
    ],
  },
  {
    id: 6,
    title: 'Real Estate',
    logo: '🏠',
    workflowCount: 5,
    description: 'Curated collection of ready-to-use starter packs designed to help real estate businesses drive conversions and listings.',
    stats: { completed: 4, running: 0, pending: 1 },
    recentWorkflows: [
      '3-BHK Flat Marketing Campaign',
      'Property Listing',
    ],
  },
  {
    id: 7,
    title: 'Retail',
    logo: '🛒',
    workflowCount: 34,
    description: 'Boost retail performance with personalized customer experiences, demand forecasting, and efficient inventory management.',
    stats: { completed: 25, running: 5, pending: 4 },
    recentWorkflows: [
      'Retail Inventory Optimization Workflow',
      'Market Intelligence Agent V4',
    ],
  },
]

const mockWorkflows = [
  {
    id: 1,
    name: 'make a trip plan to bali',
    domain: 'General',
    lastModified: '8/25/2026',
    status: 'Completed',
  },
  {
    id: 2,
    name: 'Daily Meeting Summarizer and Task Extraction',
    domain: 'General',
    lastModified: '8/25/2026',
    status: 'Completed',
  },
  {
    id: 3,
    name: 'Clinical Documentation Efficiency Enhancement',
    domain: 'Healthcare',
    lastModified: '8/25/2026',
    status: 'Pending',
  },
  {
    id: 4,
    name: 'Healthcare Cyber Risk Mitigation',
    domain: 'Healthcare',
    lastModified: '8/25/2026',
    status: 'Pending',
  },
  {
    id: 5,
    name: 'Medical Insurance Claim Validator',
    domain: 'Healthcare',
    lastModified: '8/25/2026',
    status: 'Completed',
  },
]

export default function Dashboard({
  domains = mockDomains,
  workflows = mockWorkflows,
  activeHref = '#/dashboard',
  onNavigate,
  onSelectDomain,
}) {
  const [searchText, setSearchText] = useState('')
  const [currentPageIndex, setCurrentPageIndex] = useState(1)
  const pageSize = 5

  const workflowColumnDefinitions = [
    {
      id: 'name',
      header: 'Workflow Name',
      cell: (item) => (
        <a
          href={`#/workflow-builder?name=${encodeURIComponent(item.name)}`}
          onClick={(e) => {
            e.preventDefault()
            onNavigate && onNavigate('#/workflows')
          }}
          className="table-workflow-link"
        >
          {item.name}
        </a>
      ),
      sortingField: 'name',
      isRowHeader: true,
    },
    {
      id: 'domain',
      header: 'Domain',
      cell: (item) => item.domain,
      sortingField: 'domain',
    },
    {
      id: 'lastModified',
      header: 'Last Modified',
      cell: (item) => item.lastModified,
      sortingField: 'lastModified',
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item) => (
        <span className={`custom-status-badge badge-${item.status.toLowerCase()}`}>
          {item.status}
        </span>
      ),
      sortingField: 'status',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: () => (
        <ButtonDropdown
          variant="icon"
          ariaLabel="Workflow actions"
          items={[
            { id: 'open', text: 'Open workflow' },
            { id: 'duplicate', text: 'Duplicate workflow' },
            { id: 'archive', text: 'Archive workflow' },
          ]}
        />
      ),
    },
  ]

  // Filter based on search query
  const filteredDomains = domains.filter((domain) => {
    if (domain.isMoreCard) return true
    const q = searchText.toLowerCase().trim()
    if (!q) return true
    return (
      domain.title.toLowerCase().includes(q) ||
      domain.description?.toLowerCase().includes(q) ||
      domain.recentWorkflows?.some((wf) => wf.toLowerCase().includes(q))
    )
  })

  const filteredWorkflows = workflows.filter((workflow) => {
    const q = searchText.toLowerCase().trim()
    if (!q) return true
    return (
      workflow.name.toLowerCase().includes(q) ||
      workflow.domain.toLowerCase().includes(q) ||
      workflow.status.toLowerCase().includes(q)
    )
  })

  return (
    <div className="dashboard-page-container">
      <SpaceBetween size="l" direction="vertical">
            {/* Top Dashboard Header & Search Card */}
            <header className="dashboard-top-section">
              <div className="dashboard-title-group">
                <div className="dashboard-heading-box">
                  <h1 className="dashboard-main-title">Dashboard</h1>
                  <p className="dashboard-subtitle">
                    Manage agentic domains, monitor workflow lifecycles, and orchestrate enterprise AI services.
                  </p>
                </div>
                <div className="dashboard-action-buttons">
                  <button
                    type="button"
                    className="btn-secondary-action"
                    onClick={() => onNavigate && onNavigate('#/domains')}
                  >
                    + Create New Domain
                  </button>
                  <button
                    type="button"
                    className="btn-primary-action"
                    onClick={() => onNavigate && onNavigate('#/workflows')}
                  >
                    + Create New Workflow
                  </button>
                </div>
              </div>

              {/* Search Bar - Centered below header */}
              <div className="dashboard-search-container">
                <div className="dashboard-search-box">
                  <svg
                    className="search-icon"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search workflows, domains, or recent tasks..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="dashboard-search-input"
                    aria-label="Search workflows and domains"
                  />
                  {searchText && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setSearchText('')}
                      aria-label="Clear search query"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </header>

            {/* My Domains Section */}
            <section className="domains-container" aria-labelledby="my-domains-heading">
              <div className="section-header-row">
                <h2 id="my-domains-heading" className="section-title">My Domains</h2>
                <span className="domains-counter-caption">
                  {filteredDomains.length} {filteredDomains.length === 1 ? 'domain' : 'domains'}
                </span>
              </div>

              {filteredDomains.length === 0 ? (
                <div className="domains-empty-msg">
                  <div className="empty-icon" aria-hidden="true">🔍</div>
                  <b>No matching domains found</b>
                  <p>Try refining your search keywords or clear the filter.</p>
                </div>
              ) : (
                <div className="dashboard-domains-grid">
                  {filteredDomains.map((domain) => {
                    if (domain.isMoreCard) {
                      return (
                        <div
                          key="more-card"
                          className="dashboard-domain-card more-card"
                          onClick={() => onNavigate && onNavigate('#/domains')}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              onNavigate && onNavigate('#/domains')
                            }
                          }}
                        >
                          <div className="more-card-inner">
                            <div className="more-card-icon" aria-hidden="true">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            </div>
                            <span className="more-card-title">Explore All Domains</span>
                            <span className="more-card-subtitle">Manage or register new domains</span>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <article
                        key={domain.id}
                        className="dashboard-domain-card"
                        onClick={() => onSelectDomain && onSelectDomain(domain)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onSelectDomain && onSelectDomain(domain)
                          }
                        }}
                      >
                        {/* Header: Logo, Title, Workflow Count */}
                        <div className="domain-card-header">
                          <div className="domain-header-left">
                            <span className="domain-avatar-badge" aria-hidden="true">
                              {domain.logo || '📁'}
                            </span>
                            <div className="domain-title-wrapper">
                              <h3 className="domain-title-link">{domain.title}</h3>
                              {domain.seller && (
                                <span className="domain-seller-label">{domain.seller}</span>
                              )}
                            </div>
                          </div>
                          <span className="domain-count-badge">
                            {domain.workflowCount || 0} {domain.workflowCount === 1 ? 'wf' : 'wfs'}
                          </span>
                        </div>

                        {/* Body: Clamped description and quick stats */}
                        <div className="domain-card-body">
                          <p className="domain-card-description" title={domain.description}>
                            {domain.description}
                          </p>

                          {domain.stats && (
                            <div className="domain-stats-row" aria-label="Workflow statistics">
                              <span className="domain-stat-pill pill-completed" title="Completed workflows">
                                ✓ {domain.stats.completed || 0}
                              </span>
                              <span className="domain-stat-pill pill-running" title="Running workflows">
                                ⚡ {domain.stats.running || 0}
                              </span>
                              <span className="domain-stat-pill pill-pending" title="Pending workflows">
                                ⏱ {domain.stats.pending || 0}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Footer: Anchored Recent Workflows + View Domain CTA */}
                        <div className="domain-card-footer">
                          <div className="domain-recent-section">
                            <span className="domain-recent-title">RECENT WORKFLOWS</span>
                            <ul className="domain-recent-list">
                              {domain.recentWorkflows && domain.recentWorkflows.length > 0 ? (
                                domain.recentWorkflows.slice(0, 2).map((wf, idx) => (
                                  <li key={idx} className="domain-recent-item" title={wf}>
                                    <span className="domain-bullet" aria-hidden="true">›</span>
                                    <span className="domain-wf-name">{wf}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="domain-recent-item text-muted">
                                  <span className="domain-wf-name">No workflows configured</span>
                                </li>
                              )}
                            </ul>
                          </div>

                          <div className="domain-action-row">
                            <span className="domain-action-text">Explore workflows</span>
                            <svg
                              className="domain-action-arrow"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Workflows Table */}
            <div className="clean-table-container">
              <Table
                columnDefinitions={workflowColumnDefinitions}
                items={filteredWorkflows.slice(
                  (currentPageIndex - 1) * pageSize,
                  currentPageIndex * pageSize
                )}
                header={
                  <div className="section-header-row">
                    <h2 className="section-title">Workflows</h2>
                    <span className="domains-counter-caption">
                      {filteredWorkflows.length} {filteredWorkflows.length === 1 ? 'workflow' : 'workflows'}
                    </span>
                  </div>
                }
                empty={
                  <div className="domains-empty-msg">
                    <div className="empty-icon" aria-hidden="true">📋</div>
                    <b>No workflows found</b>
                    <p>No workflows match your search query.</p>
                  </div>
                }
                pagination={
                  <Pagination
                    currentPageIndex={currentPageIndex}
                    pagesCount={Math.max(1, Math.ceil(filteredWorkflows.length / pageSize))}
                    onChange={({ detail }) =>
                      setCurrentPageIndex(detail.currentPageIndex)
                    }
                  />
                }
              />
            </div>
          </SpaceBetween>
        </div>
  )
}

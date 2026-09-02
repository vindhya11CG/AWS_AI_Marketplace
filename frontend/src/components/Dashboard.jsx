import React, { useState } from 'react'
import {
  AppLayout,
  Box,
  Button,
  ButtonDropdown,
  Cards,
  Container,
  Header,
  Link,
  SpaceBetween,
  Table,
  Pagination,
} from '@cloudscape-design/components'
import Sidebar from './Sidebar'
import '../styles/Dashboard.css'

const mockDomains = [
  {
    id: 1,
    title: 'Manufacturing',
    workflowCount: 28,
    description: 'Enhance manufacturing efficiency through optimized production lines and quality control systems.',
    recentWorkflows: [
      'IntelliWork - Intelligent Work Order & Resolution Adherence Agent',
      'Design_Document_QC_Check_Manufacturing',
    ],
  },
  {
    id: 2,
    title: 'Finance & Insurance',
    workflowCount: 64,
    description: 'Streamline financial operations with risk assessment, fraud detection, and compliance monitoring.',
    recentWorkflows: [
      'Delhi Travel Budget Planning',
      'Invoice Processing Automation',
    ],
  },
  {
    id: 3,
    title: 'Healthcare',
    workflowCount: 99,
    description: 'A comprehensive multi-agent system for managing medical insurance policies, payments, claims, and reporting for...',
    recentWorkflows: [
      'Clinical Documentation Efficiency Enhancement',
      'Healthcare Cyber Risk Mitigation',
    ],
  },
  {
    id: 4,
    title: 'SDLC',
    workflowCount: 39,
    description: 'A Multi-Agent System framework to streamline and optimize the Software Development Life Cycle, from requirement...',
    recentWorkflows: [
      'SDLC Requirements Clarification Workflow',
      'Test Workflow',
    ],
  },
  {
    id: 5,
    title: 'Public Sector Services & Governance',
    workflowCount: 8,
    description: 'Covers government-owned organizations providing essential public services like healthcare, education, transportation,...',
    recentWorkflows: [
      'Metropolitan Traffic Reduction Plan',
      'Govt Approval Application Automation',
    ],
  },
  {
    id: 6,
    title: 'Real Estate',
    workflowCount: 5,
    description: 'This domain offers a curated collection of ready-to-use starter packs designed to help real estate businesses drive...',
    recentWorkflows: [
      '3-BHK Flat Marketing Campaign',
      'Property Listing',
    ],
  },
  {
    id: 7,
    title: 'Retail',
    workflowCount: 34,
    description: 'Boost retail performance with personalized customer experiences and efficient inventory management.',
    recentWorkflows: [
      'Retail Inventory Optimization Workflow',
      'Market Intelligence Agent V4',
    ],
  },
  {
    id: 8,
    isMoreCard: true,
    title: 'More',
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
    name: 'IntelliWork - Intelligent Work Order & Resolution Adherence Agent',
    domain: 'Manufacturing',
    lastModified: '8/25/2026',
    status: 'Pending',
  },
  {
    id: 3,
    name: 'BrandGuardv4',
    domain: 'Luxury',
    lastModified: '8/21/2026',
    status: 'Pending',
  },
]

export default function Dashboard({
  domains = mockDomains,
  workflows = mockWorkflows,
  activeHref = '#/dashboard',
  onNavigate,
  onSelectDomain,
}) {
  const [selectedItems, setSelectedItems] = useState([])
  const [searchText, setSearchText] = useState('')

  const workflowColumnDefinitions = [
    {
      id: 'name',
      header: 'Workflow Name',
      cell: (item) => item.name,
      sortingField: 'name',
    },
    {
      id: 'domain',
      header: 'Associated Domain',
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

  const domainCardDefinition = {
    header: (item) => {
      if (item.isMoreCard) {
        return (
          <div className="more-card-header">
            <span className="more-card-label">More</span>
            <div className="more-card-arrow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0073bb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 16 16 12 12 8" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
          </div>
        )
      }
      return (
        <div className="domain-card-header">
          <Link href="#" fontSize="heading-s" className="domain-title-link">
            {item.title}
          </Link>
          <span className="domain-count-badge">{item.workflowCount}</span>
        </div>
      )
    },
    sections: [
      {
        id: 'content',
        content: (item) => {
          if (item.isMoreCard) return null
          return (
            <div className="domain-card-body">
              <p className="domain-card-description">{item.description}</p>
              <div className="domain-recent-section">
                <span className="domain-recent-title">RECENT WORKFLOWS</span>
                <ul className="domain-recent-list">
                  {item.recentWorkflows?.map((wf, idx) => (
                    <li key={idx} className="domain-recent-item">
                      <span className="domain-bullet">•</span>
                      <span className="domain-wf-name">{wf}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        },
      },
    ],
  }

  // Filter based on search query
  const filteredDomains = mockDomains.filter((domain) => {
    if (domain.isMoreCard) return true
    const q = searchText.toLowerCase()
    return (
      domain.title.toLowerCase().includes(q) ||
      domain.description.toLowerCase().includes(q) ||
      domain.recentWorkflows?.some((wf) => wf.toLowerCase().includes(q))
    )
  })

  const filteredWorkflows = mockWorkflows.filter((workflow) => {
    const q = searchText.toLowerCase()
    return (
      workflow.name.toLowerCase().includes(q) ||
      workflow.domain.toLowerCase().includes(q) ||
      workflow.status.toLowerCase().includes(q)
    )
  })

  return (
    <AppLayout
      navigation={
        <Sidebar activeHref={activeHref} onNavigate={onNavigate} />
      }
      content={
        <SpaceBetween size="l" direction="vertical">
          {/* Top Dashboard Header & Search Row */}
          <div className="dashboard-top-section">
            <div className="dashboard-title-group">
              <h1 className="dashboard-main-title">Dashboard</h1>
              <div className="dashboard-action-buttons">
                <button
                  type="button"
                  className="btn-create-domain"
                  onClick={() => onNavigate && onNavigate('#/domains')}
                >
                  + Create New Domain
                </button>
                <button
                  type="button"
                  className="btn-create-workflow"
                  onClick={() => onNavigate && onNavigate('#/workflows')}
                >
                  + Create New Workflow
                </button>
              </div>
            </div>

            {/* AI Market Style Search Bar */}
            <div className="ai-market-search-box">
              <input
                type="text"
                placeholder="Search workflows/domains"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="ai-market-search-input"
              />
              <button
                type="button"
                className="ai-market-search-button"
                aria-label="Search"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </div>
          </div>

          {/* My Domains Section */}
          <div className="domains-container">
            <h2 className="section-title">My Domains</h2>
            <Cards
              cardDefinition={domainCardDefinition}
              cardsPerRow={[
                { cards: 1 },
                { minWidth: 600, cards: 2 },
                { minWidth: 900, cards: 3 },
                { minWidth: 1200, cards: 4 },
              ]}
              items={filteredDomains}
              empty={
                <Box textAlign="center" color="inherit">
                  <b>No domains found</b>
                  <Box variant="p" color="inherit">
                    No domains match your search query.
                  </Box>
                </Box>
              }
            />
          </div>

          {/* Recent Workflows Section */}
          <Container
            header={
              <Header variant="h2">
                Recent Workflows
              </Header>
            }
          >
            <Table
              columnDefinitions={workflowColumnDefinitions}
              items={filteredWorkflows}
              selectedItems={selectedItems}
              onSelectionChange={(event) =>
                setSelectedItems(event.detail.selectedItems)
              }
              variant="embedded"
              pagination={
                <Pagination currentPageIndex={1} pagesCount={1} />
              }
            />
          </Container>
        </SpaceBetween>
      }
      toolsHide={true}
    />
  )
}
import React, { useState } from 'react'
import {
  AppLayout,
  Box,
  ButtonDropdown,
  Cards,
  Container,
  Header,
  Link,
  SpaceBetween,
  Table,
  Pagination,
  Badge,
} from '@cloudscape-design/components'
import Sidebar from './Sidebar'
import '../styles/Dashboard.css'

const mockDomains = [
  {
    id: 1,
    title: 'Manufacturing',
    seller: 'Manufacturing Inc.',
    workflowCount: 24,
    rating: 4.4,
    ratingCount: 10001,
    badge: 'Deployed on AWS',
    logo: '🏭',
    description: 'Enhance manufacturing efficiency through optimized production lines and quality control systems.',
    recentWorkflows: [
      'IntelliWork - Intelligent Work Order & Resolution Adherence Agent',
      'Design - Document_QC_Check_Manufacturing',
    ],
  },
  {
    id: 2,
    title: 'Finance & Insurance',
    seller: 'Finance Services Ltd.',
    workflowCount: 12,
    rating: 4.2,
    ratingCount: 5230,
    badge: 'AWS Free Tier',
    logo: '💰',
    description: 'Streamline financial operations with risk assessment, fraud detection, and compliance monitoring.',
    recentWorkflows: [
      'Delhi Travel Budget Planning',
      'Invoice Processing Automation',
    ],
  },
  {
    id: 3,
    title: 'Healthcare',
    seller: 'HealthTech Solutions',
    workflowCount: 8,
    rating: 4.6,
    ratingCount: 3421,
    badge: 'Deployed on AWS',
    logo: '🏥',
    description: 'A comprehensive multi-agent system for managing medical insurance policies, payments, claims, and reporting for...',
    recentWorkflows: [
      'Clinical Documentation Efficiency Enhancement',
      'Healthcare Cyber Risk Mitigation',
    ],
  },
  {
    id: 4,
    title: 'SDLC',
    seller: 'DevOps Pro',
    workflowCount: 35,
    rating: 4.5,
    ratingCount: 8901,
    badge: 'AWS Free Tier',
    logo: '⚙️',
    description: 'A Multi-Agent System framework to streamline and optimize the Software Development Life Cycle, from requirement...',
    recentWorkflows: [
      'SDLC Requirements Clarification Workflow',
      'Test Workflow',
    ],
  },
  {
    id: 5,
    title: 'Public Sector Services & Governance',
    seller: 'GovTech Solutions',
    workflowCount: 9,
    rating: 4.3,
    ratingCount: 2156,
    badge: 'Deployed on AWS',
    logo: '🏛️',
    description: 'Covers government-owned organizations providing essential public services like healthcare, education, transportation,...',
    recentWorkflows: [
      'Metropolitan Traffic Reduction Plan',
      'Govt Approval Application Automation',
    ],
  },
  {
    id: 6,
    title: 'Real Estate',
    seller: 'RealEstate Innovations',
    workflowCount: 8,
    rating: 4.1,
    ratingCount: 1843,
    badge: 'AWS Free Tier',
    logo: '🏠',
    description: 'This domain offers a curated collection of ready-to-use starter packs designed to help real estate businesses drive...',
    recentWorkflows: [
      '3-BHK Flat Marketing Campaign',
      'Property Listing',
    ],
  },
  {
    id: 7,
    title: 'Retail',
    seller: 'RetailTech Pro',
    workflowCount: 34,
    rating: 4.7,
    ratingCount: 15234,
    badge: 'Deployed on AWS',
    logo: '🛒',
    description: 'Boost retail performance with personalized customer experiences and efficient inventory management.',
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

/**
 * Dashboard component - Main application view
 * Displays domains and recent workflows in a grid and table layout
 */
export default function Dashboard() {
  const [activeHref, setActiveHref] = useState('#/dashboard')
  const [selectedItems, setSelectedItems] = useState([])
  const [searchText, setSearchText] = useState('')

  /**
   * Maps workflow status to badge color
   * @param {string} status - The workflow status
   * @returns {string} - The badge color code
   */
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'green'
      case 'Pending':
        return 'blue'
      default:
        return 'grey'
    }
  }

  /**
   * Workflow table column definitions
   */
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
        <Badge color={getStatusBadgeColor(item.status)}>
          {item.status}
        </Badge>
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
    header: (item) => (
      <SpaceBetween size="xs" direction="horizontal" alignItems="center">
        <Box fontSize="heading-s">{item.logo || '📦'}</Box>
        <Link href="#" fontSize="heading-s">
          {item.title}
        </Link>
      </SpaceBetween>
    ),
    sections: [
      {
        id: 'seller',
        header: 'Sold by',
        content: (item) => item.seller || 'Provider',
      },
      {
        id: 'rating',
        header: 'Rating',
        content: (item) => `${item.rating || 0} (${item.ratingCount || 0})`,
      },
      {
        id: 'badge',
        header: 'Tag',
        content: (item) => (
          <Badge color={item.badge === 'AWS Free Tier' ? 'blue' : 'red'}>
            {item.badge || 'Standard'}
          </Badge>
        ),
      },
      {
        id: 'description',
        header: 'Description',
        content: (item) => item.description,
      },
      {
        id: 'actions',
        content: (item) => (
          <ButtonDropdown
            variant="normal"
            items={[
              { id: 'start-template', text: 'Start from template' },
              { id: 'open-workflows', text: 'Open workflows' },
              { id: 'view-domain', text: 'View domain details' },
            ]}
            ariaLabel={`Get started with ${item.title}`}
          >
            Get Started
          </ButtonDropdown>
        ),
      },
    ],
  }

  const filteredDomains = mockDomains.filter((domain) => {
    const query = searchText.trim().toLowerCase()
    if (!query) return true
    return (
      domain.title.toLowerCase().includes(query) ||
      domain.seller.toLowerCase().includes(query) ||
      domain.description.toLowerCase().includes(query)
    )
  })

  const filteredWorkflows = mockWorkflows.filter((workflow) => {
    const query = searchText.trim().toLowerCase()
    if (!query) return true
    return (
      workflow.name.toLowerCase().includes(query) ||
      workflow.domain.toLowerCase().includes(query) ||
      workflow.status.toLowerCase().includes(query)
    )
  })

  return (
    <AppLayout
      navigation={<Sidebar activeHref={activeHref} onNavigate={setActiveHref} />}
      content={
        <SpaceBetween size="m" direction="vertical">
          {/* Top Row: Dashboard Title on Left, Search Bar on Right */}
          <div className="dashboard-top-row">
            <h1 className="dashboard-page-title">Dashboard</h1>
            <div className="top-search-bar">
              <input
                type="text"
                placeholder="Search workflows/domains"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="top-search-input"
              />
              <button
                type="button"
                className="top-search-button"
                aria-label="Search"
              >
                <svg
                  width="16"
                  height="16"
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

          {/* Action Buttons: Positioned directly below Dashboard title */}
          <div className="dashboard-action-buttons-row">
            <button type="button" className="btn-create-domain">
              + Create New Domain
            </button>
            <button type="button" className="btn-create-workflow">
              + Create New Workflow
            </button>
          </div>

          {/* My Domains Section */}
          <Container header={<Header variant="h2">My Domains</Header>}>
            <Cards
              cardDefinition={domainCardDefinition}
              cardsPerRow={[
                { cards: 1 },
                { minWidth: 500, cards: 2 },
                { minWidth: 1100, cards: 3 },
              ]}
              items={filteredDomains}
              loadingText="Loading domains"
              empty={
                <Box textAlign="center" color="inherit">
                  <b>No domains</b>
                  <Box variant="p" color="inherit">
                    No domains to display.
                  </Box>
                </Box>
              }
            />
          </Container>

          {/* Recent Workflows Section */}
          <Container header={<Header variant="h2">Recent Workflows</Header>}>
            <Table
              columnDefinitions={workflowColumnDefinitions}
              items={filteredWorkflows}
              selectedItems={selectedItems}
              onSelectionChange={(event) =>
                setSelectedItems(event.detail.selectedItems)
              }
              variant="embedded"
              pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
            />
          </Container>
        </SpaceBetween>
      }
      toolsHide={true}
    />
  )
}

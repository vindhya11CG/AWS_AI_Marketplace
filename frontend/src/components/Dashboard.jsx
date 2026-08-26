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

export default function Dashboard({
  domains = [],
  workflows = [],
  activeHref = '#/dashboard',
  onNavigate,
  onSelectDomain,
}) {
  const [selectedItems, setSelectedItems] = useState([])
  const [searchText, setSearchText] = useState('')

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'green'
      case 'Pending':
        return 'blue'
      case 'Running':
        return 'blue'
      default:
        return 'grey'
    }
  }

  const workflowColumnDefinitions = [
    {
      id: 'name',
      header: 'Workflow Name',
      cell: (item) => (
        <span
          className="wf-name-clickable"
          onClick={() => {
            const dom = domains.find(
              (d) => d.id === item.domainId || d.title === item.domain
            )
            if (dom && onSelectDomain) onSelectDomain(dom)
          }}
        >
          {item.name}
        </span>
      ),
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
        <Badge color={getStatusBadgeColor(item.status)}>{item.status}</Badge>
      ),
      sortingField: 'status',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item) => (
        <ButtonDropdown
          variant="icon"
          ariaLabel="Workflow actions"
          onItemClick={({ detail }) => {
            if (detail.id === 'open') {
              const dom = domains.find(
                (d) => d.id === item.domainId || d.title === item.domain
              )
              if (dom && onSelectDomain) onSelectDomain(dom)
            }
          }}
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
        <span
          className="domain-card-title-link"
          onClick={() => onSelectDomain && onSelectDomain(item)}
        >
          {item.title}
        </span>
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
            onItemClick={({ detail }) => {
              if (detail.id === 'view-domain' || detail.id === 'open-workflows') {
                if (onSelectDomain) onSelectDomain(item)
              } else if (detail.id === 'start-template') {
                if (onNavigate) onNavigate('#/workflows')
              }
            }}
            items={[
              { id: 'view-domain', text: 'View domain details' },
              { id: 'open-workflows', text: 'Open workflows' },
              { id: 'start-template', text: 'Start from template' },
            ]}
            ariaLabel={`Get started with ${item.title}`}
          >
            Get Started
          </ButtonDropdown>
        ),
      },
    ],
  }

  const filteredDomains = domains.filter((domain) => {
    const query = searchText.trim().toLowerCase()
    if (!query) return true
    return (
      domain.title.toLowerCase().includes(query) ||
      domain.seller?.toLowerCase().includes(query) ||
      domain.description?.toLowerCase().includes(query)
    )
  })

  const filteredWorkflows = workflows.filter((workflow) => {
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
      navigation={<Sidebar activeHref={activeHref} onNavigate={onNavigate} />}
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
            <button
              type="button"
              className="btn-create-domain"
              onClick={() => onNavigate('#/domains')}
            >
              + Create New Domain
            </button>
            <button
              type="button"
              className="btn-create-workflow"
              onClick={() => onNavigate('#/workflows')}
            >
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

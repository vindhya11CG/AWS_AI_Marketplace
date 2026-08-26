import React, { useState } from 'react'
import {
  AppLayout,
  Box,
  Button,
  ButtonDropdown,
  Container,
  Header,
  SpaceBetween,
  Table,
  Pagination,
  Badge,
} from '@cloudscape-design/components'
import Sidebar from './Sidebar'
import '../styles/DomainDetails.css'

export default function DomainDetails({
  domain,
  workflows = [],
  onNavigate,
  onNavigateToBuilder,
  activeHref = '#/domains',
}) {
  const [selectedItems, setSelectedItems] = useState([])

  if (!domain) {
    return (
      <AppLayout
        navigation={<Sidebar activeHref={activeHref} onNavigate={onNavigate} />}
        content={
          <div className="domain-details-page">
            <Button onClick={() => onNavigate('#/domains')}>← Back to Domains</Button>
            <Box variant="h2" margin={{ top: 'l' }}>
              No domain selected
            </Box>
          </div>
        }
        toolsHide={true}
      />
    )
  }

  // Workflows matching this domain
  const domainWorkflows = workflows.filter(
    (wf) =>
      wf.domainId === domain.id ||
      wf.domain?.toLowerCase() === domain.title?.toLowerCase()
  )

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'green'
      case 'Running':
        return 'blue'
      case 'Pending':
        return 'blue'
      default:
        return 'grey'
    }
  }

  const workflowColumns = [
    {
      id: 'name',
      header: 'Workflow Name',
      cell: (item) => <span className="wf-detail-name">{item.name}</span>,
      sortingField: 'name',
    },
    {
      id: 'agents',
      header: 'Agents Involved',
      cell: (item) => (
        <div className="agents-tag-list">
          {item.agents?.map((agent, i) => (
            <span key={i} className="agent-tag">
              🤖 {agent}
            </span>
          )) || <span className="text-muted">Standard Agents</span>}
        </div>
      ),
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
      cell: () => (
        <ButtonDropdown
          variant="icon"
          ariaLabel="Workflow actions"
          items={[
            { id: 'run', text: 'Execute workflow' },
            { id: 'edit', text: 'Edit in builder' },
            { id: 'duplicate', text: 'Duplicate workflow' },
          ]}
        />
      ),
    },
  ]

  return (
    <AppLayout
      navigation={<Sidebar activeHref={activeHref} onNavigate={onNavigate} />}
      content={
        <div className="domain-details-page">
          {/* Breadcrumb / Top Bar */}
          <div className="domain-details-topbar">
            <button
              type="button"
              className="back-btn"
              onClick={() => onNavigate('#/domains')}
            >
              ← Back to Domains
            </button>
          </div>

          <SpaceBetween size="l" direction="vertical">
            {/* Domain Overview Card */}
            <div className="domain-header-card">
              <div className="domain-header-content">
                <div className="domain-icon-large">{domain.logo || '📁'}</div>
                <div className="domain-main-details">
                  <div className="domain-title-status-line">
                    <h1 className="domain-page-title">{domain.title}</h1>
                    <span className="inactive-badge">{domain.status || 'Inactive'}</span>
                    <span className="aws-badge-pill">{domain.badge || 'Deployed on AWS'}</span>
                  </div>
                  <p className="domain-detail-desc">{domain.description}</p>

                  <div className="domain-meta-grid">
                    <div className="meta-item">
                      <span className="meta-label">Total Workflows:</span>
                      <span className="meta-value">{domain.workflowCount || domainWorkflows.length}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Rating:</span>
                      <span className="meta-value">⭐ {domain.rating || '4.5'} ({domain.ratingCount || '100+'})</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Knowledge Files:</span>
                      <span className="meta-value">
                        {domain.knowledgeFiles?.length
                          ? domain.knowledgeFiles.join(', ')
                          : 'None attached'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="domain-header-actions">
                <Button
                  variant="primary"
                  onClick={() => onNavigateToBuilder(domain)}
                >
                  + Create Workflow in {domain.title}
                </Button>
              </div>
            </div>

            {/* Workflows in this Domain */}
            <Container
              header={
                <Header
                  variant="h2"
                  actions={
                    <Button
                      variant="normal"
                      onClick={() => onNavigateToBuilder(domain)}
                    >
                      + Add Workflow
                    </Button>
                  }
                >
                  Workflows within {domain.title}
                </Header>
              }
            >
              {domainWorkflows.length === 0 ? (
                <Box textAlign="center" color="inherit" padding="l">
                  <b>No workflows in this domain yet</b>
                  <Box variant="p" color="inherit" margin={{ top: 'xs', bottom: 'm' }}>
                    Create your first autonomous workflow for {domain.title}.
                  </Box>
                  <Button
                    variant="primary"
                    onClick={() => onNavigateToBuilder(domain)}
                  >
                    Create New Workflow
                  </Button>
                </Box>
              ) : (
                <Table
                  columnDefinitions={workflowColumns}
                  items={domainWorkflows}
                  selectedItems={selectedItems}
                  onSelectionChange={(event) =>
                    setSelectedItems(event.detail.selectedItems)
                  }
                  variant="embedded"
                  pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
                />
              )}
            </Container>
          </SpaceBetween>
        </div>
      }
      toolsHide={true}
    />
  )
}

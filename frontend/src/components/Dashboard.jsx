import React, { useState } from 'react'
import {
  AppLayout,
  Button,
  Table,
  Pagination,
  Badge,
} from '@cloudscape-design/components'
import Sidebar from './Sidebar'
import DomainCard from './DomainCard'
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
        <button className="action-button" aria-label="More actions">
          ⋮
        </button>
      ),
    },
  ]

  return (
    <AppLayout
      navigation={<Sidebar activeHref={activeHref} onNavigate={setActiveHref} />}
      content={
        <div style={{ padding: 'var(--spacing-lg)' }}>
          {/* Dashboard Header */}
          <section className="dashboard-header">
            <h1 className="dashboard-title">Dashboard</h1>
            <div className="dashboard-actions">
              <Button variant="primary">+ Create New Domain</Button>
              <Button variant="primary">+ Create New Workflow</Button>
            </div>
          </section>

          {/* My Domains Section */}
          <section>
            <h2 className="section-title">My Domains</h2>
            <div className="domains-grid">
              {mockDomains.map((domain) => (
                <DomainCard key={domain.id} domain={domain} />
              ))}
            </div>
          </section>

          {/* Recent Workflows Section */}
          <section>
            <h2 className="section-title">Recent Workflows</h2>
            <Table
              columnDefinitions={workflowColumnDefinitions}
              items={mockWorkflows}
              selectedItems={selectedItems}
              onSelectionChange={(event) => setSelectedItems(event.detail.selectedItems)}
              variant="full-page"
              pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
            />
          </section>
        </div>
      }
      toolsHide={true}
    />
  )
}

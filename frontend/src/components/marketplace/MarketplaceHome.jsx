import React, { useMemo, useState, useEffect } from 'react'
import {
  AppLayout,
  Select,
  TextFilter,
} from '@cloudscape-design/components'
import Sidebar from '../Sidebar'
import HeroBanner from './HeroBanner'
import IndustryAccordion from './IndustryAccordion'
import DomainAccordion from './DomainAccordion'
import DemoEnvironment from './DemoEnvironment'
import CaseStudies from './CaseStudies'
import CreateStarterPackCTA from './CreateStarterPackCTA'
import StarterPackDetailModal from './StarterPackDetailModal'
import SharePointImporterModal from './SharePointImporterModal'
import {
  CASE_STUDIES,
  INDUSTRIES,
  AGENT_DOMAINS,
  buildIndustryFilterOptions,
  buildDomainFilterOptions,
} from '../../data/marketplaceData'

function filterIndustries(industries, industryId, searchText) {
  const normalizedQuery = searchText.trim().toLowerCase()

  return industries
    .filter((industry) => industryId === 'all' || industry.id === industryId)
    .map((industry) => ({
      ...industry,
      starterPacks: industry.starterPacks.filter((pack) => {
        if (!normalizedQuery) return true
        return (
          pack.title.toLowerCase().includes(normalizedQuery) ||
          pack.description.toLowerCase().includes(normalizedQuery) ||
          pack.benefits.toLowerCase().includes(normalizedQuery)
        )
      }),
    }))
    .filter((industry) => industry.starterPacks.length > 0)
}

function filterDomains(domains, domainId, searchText) {
  const normalizedQuery = searchText.trim().toLowerCase()

  return domains
    .filter((domain) => domainId === 'all' || domain.id === domainId)
    .map((domain) => ({
      ...domain,
      agents: domain.agents.filter((agent) => {
        if (!normalizedQuery) return true
        return (
          agent.title.toLowerCase().includes(normalizedQuery) ||
          agent.description.toLowerCase().includes(normalizedQuery) ||
          agent.benefits.toLowerCase().includes(normalizedQuery) ||
          agent.capabilities?.some((c) => c.toLowerCase().includes(normalizedQuery))
        )
      }),
    }))
    .filter((domain) => domain.agents.length > 0)
}

export default function MarketplaceHome({ activeHref = '#/marketplace', onNavigate }) {
  // Toggle between 'Starter Pack' and 'Agents'
  const [activeList, setActiveList] = useState('Starter Pack')
  const [catalogIndustries, setCatalogIndustries] = useState(INDUSTRIES)
  const [catalogDomains, setCatalogDomains] = useState(AGENT_DOMAINS)
  const [isImporterOpen, setIsImporterOpen] = useState(false)

  // Accordion Expand/Collapse Map
  const [industryOpenMap, setIndustryOpenMap] = useState(() => ({ bfsi: true }))
  const [domainOpenMap, setDomainOpenMap] = useState(() => ({ consultancy: true }))

  // Search and Filter State
  const [selectedIndustry, setSelectedIndustry] = useState({ label: 'All Industries', value: 'all' })
  const [selectedDomain, setSelectedDomain] = useState({ label: 'All Domains', value: 'all' })
  const [searchText, setSearchText] = useState('')

  // Modal State
  const [selectedItem, setSelectedItem] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenDetails = (item) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleCloseDetails = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
  }

  const toggleIndustry = (id) => {
    setIndustryOpenMap((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleDomain = (id) => {
    setDomainOpenMap((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Expand / Collapse All
  const handleToggleExpandAll = () => {
    if (activeList === 'Starter Pack') {
      const anyCollapsed = catalogIndustries.some((ind) => !industryOpenMap[ind.id])
      const newMap = {}
      catalogIndustries.forEach((ind) => {
        newMap[ind.id] = anyCollapsed
      })
      setIndustryOpenMap(newMap)
    } else {
      const anyCollapsed = catalogDomains.some((dom) => !domainOpenMap[dom.id])
      const newMap = {}
      catalogDomains.forEach((dom) => {
        newMap[dom.id] = anyCollapsed
      })
      setDomainOpenMap(newMap)
    }
  }

  const isAllExpanded = activeList === 'Starter Pack'
    ? catalogIndustries.every((ind) => !!industryOpenMap[ind.id])
    : catalogDomains.every((dom) => !!domainOpenMap[dom.id])

  // Computed Lists
  const filteredIndustries = useMemo(
    () => filterIndustries(catalogIndustries, selectedIndustry.value, searchText),
    [catalogIndustries, selectedIndustry, searchText]
  )

  const filteredDomains = useMemo(
    () => filterDomains(catalogDomains, selectedDomain.value, searchText),
    [catalogDomains, selectedDomain, searchText]
  )

  const totalStarterPacks = useMemo(
    () => catalogIndustries.reduce((acc, ind) => acc + ind.starterPacks.length, 0),
    [catalogIndustries]
  )

  const totalAgents = useMemo(
    () => catalogDomains.reduce((acc, dom) => acc + dom.agents.length, 0),
    [catalogDomains]
  )

  return (
    <>
      <AppLayout
        navigation={<Sidebar activeHref={activeHref} onNavigate={onNavigate} />}
        content={
          <div className="marketplace-main-content-flow">
            {/* Top Hero Banner */}
            <HeroBanner />

            {/* Segmented Toggle + Search + Action Controls Bar */}
            <div className="marketplace-toolbar-card">
              <div className="toolbar-top-row">
                {/* Segmented Toggle (Starter Pack / Agents) */}
                <div className="segmented-toggle-group" role="tablist">
                  <button
                    type="button"
                    className={`btn-segment ${activeList === 'Starter Pack' ? 'segment-active' : ''}`}
                    onClick={() => {
                      setActiveList('Starter Pack')
                      setSearchText('')
                    }}
                  >
                    Starter Pack
                  </button>
                  <button
                    type="button"
                    className={`btn-segment ${activeList === 'Agents' ? 'segment-active' : ''}`}
                    onClick={() => {
                      setActiveList('Agents')
                      setSearchText('')
                    }}
                  >
                    Agents
                  </button>
                </div>

                {/* Integrated Search Input */}
                <div className="toolbar-search-input-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by any word..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="toolbar-search-field"
                  />
                </div>

                {/* Action Buttons */}
                <div className="toolbar-action-buttons">
                  <button
                    type="button"
                    className="btn-toolbar-blue"
                    onClick={handleToggleExpandAll}
                  >
                    {isAllExpanded ? 'Collapse All' : 'Expand All'}
                  </button>

                  <button
                    type="button"
                    className="btn-toolbar-blue"
                    onClick={() => onNavigate && onNavigate('#/workflows')}
                  >
                    Create your own Starter Pack
                  </button>

                  <button
                    type="button"
                    className="btn-toolbar-blue"
                    onClick={() => window.location.href = 'mailto:ai-marketplace@capgemini.com'}
                  >
                    Contact us
                  </button>
                </div>
              </div>

              {/* Dynamic Description Notice */}
              <div className="toolbar-description-notice">
                {activeList === 'Starter Pack' ? (
                  <p>
                    <strong>Starter Packs:</strong> AI Starter Packs are prebuilt AI workflows powered by industry-trained orchestrated agents. They accelerate the idea-to-production journey by turning proven use cases into launch-ready solutions.
                  </p>
                ) : (
                  <p>
                    <strong>Agents:</strong> Autonomous AI systems that reason, decide, and act on tasks or workflows with minimal human input.
                  </p>
                )}
              </div>
            </div>

            {/* Main Content Layout with Accordion Catalog & Sidebar */}
            <div className="marketplace-two-column-layout">
              {/* Left Column: Accordions */}
              <div className="marketplace-left-catalog">
                {activeList === 'Starter Pack' ? (
                  <div className="catalog-accordion-wrapper">
                    <div className="catalog-header-row">
                      <h2 className="section-main-heading-clean">
                        Industry Catalog ({totalStarterPacks} Starter Packs)
                      </h2>
                    </div>
                    <IndustryAccordion
                      industries={filteredIndustries}
                      openMap={industryOpenMap}
                      onToggleIndustry={toggleIndustry}
                      onViewDetails={handleOpenDetails}
                    />
                  </div>
                ) : (
                  <div className="catalog-accordion-wrapper">
                    <div className="catalog-header-row">
                      <h2 className="section-main-heading-clean">
                        Operational Excellence Agents ({totalAgents} Agents across {catalogDomains.length} Domains)
                      </h2>
                    </div>
                    <DomainAccordion
                      domains={filteredDomains}
                      openMap={domainOpenMap}
                      onToggleDomain={toggleDomain}
                      onViewDetails={handleOpenDetails}
                    />
                  </div>
                )}
              </div>

              {/* Right Column: Demo Environment, Industry Filter, & Case Studies */}
              <div className="marketplace-right-sidebar">
                {/* Demo Environment Card */}
                <div className="sidebar-widget-card">
                  <h3 className="sidebar-widget-title">Demo environment for Agentic Experience</h3>
                  <button
                    type="button"
                    className="btn-guest-login-pill"
                    onClick={() => alert('Launching Guest Environment Demo...')}
                  >
                    Login as Guest User
                  </button>
                  <a href="#/platform-guide" className="sidebar-link-guide">
                    How to use Agentic Platform? A click through guide ↗
                  </a>
                </div>

                {/* Filter by Category */}
                <div className="sidebar-widget-card">
                  <h3 className="sidebar-widget-title">
                    {activeList === 'Starter Pack' ? 'Filter Industry' : 'Filter Domain'}
                  </h3>
                  {activeList === 'Starter Pack' ? (
                    <Select
                      selectedOption={selectedIndustry}
                      onChange={({ detail }) => setSelectedIndustry(detail.selectedOption)}
                      options={buildIndustryFilterOptions(catalogIndustries)}
                      ariaLabel="Filter by industry"
                    />
                  ) : (
                    <Select
                      selectedOption={selectedDomain}
                      onChange={({ detail }) => setSelectedDomain(detail.selectedOption)}
                      options={buildDomainFilterOptions(catalogDomains)}
                      ariaLabel="Filter by domain"
                    />
                  )}
                </div>

                {/* Case Studies Widget */}
                <div className="sidebar-widget-card">
                  <h3 className="sidebar-widget-title">Case Studies</h3>
                  <div className="sidebar-case-studies-list">
                    {CASE_STUDIES.map((cs) => (
                      <div key={cs.id} className="sidebar-case-study-item">
                        <span className="case-study-item-client">{cs.client}</span>
                        <p className="case-study-item-usecase">{cs.useCase}</p>
                        <p className="case-study-item-result">{cs.result}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Call to Action */}
            <CreateStarterPackCTA />
          </div>
        }
        toolsHide={true}
      />

      <StarterPackDetailModal
        isOpen={isModalOpen}
        pack={selectedItem}
        onClose={handleCloseDetails}
      />

      <SharePointImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportItems={() => {}}
      />
    </>
  )
}

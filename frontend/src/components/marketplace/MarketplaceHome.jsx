import React, { useMemo, useState, useEffect } from 'react'
import {
  AppLayout,
  Button,
  ColumnLayout,
  Header,
  Select,
  SpaceBetween,
  TextFilter,
} from '@cloudscape-design/components'
import Sidebar from '../Sidebar'
import HeroBanner from './HeroBanner'
import QuickActions from './QuickActions'
import IndustryAccordion from './IndustryAccordion'
import DemoEnvironment from './DemoEnvironment'
import CaseStudies from './CaseStudies'
import CreateStarterPackCTA from './CreateStarterPackCTA'
import StarterPackDetailModal from './StarterPackDetailModal'
import SharePointImporterModal from './SharePointImporterModal'
import {
  CASE_STUDIES,
  INDUSTRIES,
  buildIndustryFilterOptions,
} from '../../data/marketplaceData'

function filterIndustries(industries, industryId, searchText) {
  const normalizedQuery = searchText.trim().toLowerCase()

  return industries
    .filter((industry) => industryId === 'all' || industry.id === industryId)
    .map((industry) => ({
      ...industry,
      starterPacks: industry.starterPacks.filter((pack) => {
        if (!normalizedQuery) {
          return true
        }
        return (
          pack.title.toLowerCase().includes(normalizedQuery) ||
          pack.description.toLowerCase().includes(normalizedQuery) ||
          pack.benefits.toLowerCase().includes(normalizedQuery)
        )
      }),
    }))
    .filter((industry) => industry.starterPacks.length > 0)
}

export default function MarketplaceHome({ activeHref = '#/marketplace', onNavigate }) {
  const [catalogIndustries, setCatalogIndustries] = useState(INDUSTRIES)
  const [isImporterOpen, setIsImporterOpen] = useState(false)

  // Load any previously synchronized items from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kn_custom_starter_packs')
      if (saved) {
        const customPacks = JSON.parse(saved)
        if (Array.isArray(customPacks) && customPacks.length > 0) {
          mergeCustomPacks(customPacks)
        }
      }
    } catch (e) {
      console.warn('Failed to load cached custom packs', e)
    }
  }, [])

  const mergeCustomPacks = (newPacks) => {
    setCatalogIndustries((prevIndustries) => {
      const industryMap = {}
      prevIndustries.forEach((ind) => {
        industryMap[ind.name] = { ...ind, starterPacks: [...ind.starterPacks] }
      })

      newPacks.forEach((pack) => {
        const indName = pack.industry || 'General / Other'
        if (!industryMap[indName]) {
          industryMap[indName] = {
            id: indName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: indName,
            starterPacks: [],
          }
        }
        const existingIdx = industryMap[indName].starterPacks.findIndex((p) => p.id === pack.id || p.title === pack.title)
        if (existingIdx >= 0) {
          industryMap[indName].starterPacks[existingIdx] = pack
        } else {
          industryMap[indName].starterPacks.push(pack)
        }
      })

      return Object.values(industryMap)
    })
  }

  const handleImportItems = (newPacks) => {
    mergeCustomPacks(newPacks)
    try {
      localStorage.setItem('kn_custom_starter_packs', JSON.stringify(newPacks))
    } catch (e) {
      console.warn('Failed to cache packs', e)
    }
  }

  const industryOptions = useMemo(() => buildIndustryFilterOptions(catalogIndustries), [catalogIndustries])
  const [selectedIndustry, setSelectedIndustry] = useState(industryOptions[0])
  const [searchText, setSearchText] = useState('')

  const [selectedPack, setSelectedPack] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenDetails = (pack) => {
    setSelectedPack(pack)
    setIsModalOpen(true)
  }

  const handleCloseDetails = () => {
    setIsModalOpen(false)
    setSelectedPack(null)
  }

  const filteredIndustries = useMemo(
    () => filterIndustries(catalogIndustries, selectedIndustry.value, searchText),
    [catalogIndustries, selectedIndustry, searchText]
  )

  const totalStarterPacks = useMemo(
    () => catalogIndustries.reduce((acc, ind) => acc + ind.starterPacks.length, 0),
    [catalogIndustries]
  )

  return (
    <>
      <AppLayout
        navigation={<Sidebar activeHref={activeHref} onNavigate={onNavigate} />}
        content={
          <div className="marketplace-main-content-flow">
            {/* Hero Banner */}
            <HeroBanner />

            {/* Quick Actions Row without box wrapper */}
            <div className="marketplace-quickactions-row">
              <QuickActions />
            </div>

            {/* Search & Filter Single Clean Card */}
            <div className="marketplace-search-filter-card">
              <div className="marketplace-filter-header">
                <div>
                  <h2 className="marketplace-filter-title">Starter Packs ({totalStarterPacks})</h2>
                  <p className="marketplace-filter-subtitle">
                    Prebuilt multi-agent AI workflows designed to accelerate enterprise idea-to-production.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-sync-sharepoint"
                  onClick={() => setIsImporterOpen(true)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Sync SharePoint List
                </button>
              </div>

              <div className="marketplace-filter-inputs-grid">
                <div className="filter-select-wrapper">
                  <Select
                    selectedOption={selectedIndustry}
                    onChange={({ detail }) => setSelectedIndustry(detail.selectedOption)}
                    options={industryOptions}
                    ariaLabel="Filter by industry"
                  />
                </div>
                <div className="filter-search-wrapper">
                  <TextFilter
                    filteringText={searchText}
                    filteringPlaceholder="Search starter packs by name, industry, or benefit"
                    filteringAriaLabel="Search starter packs"
                    onChange={({ detail }) => setSearchText(detail.filteringText)}
                  />
                </div>
              </div>
            </div>

            {/* Industry Catalog */}
            <div className="marketplace-catalog-section">
              <h2 className="section-main-heading-clean">Industry Catalog</h2>
              <IndustryAccordion
                industries={filteredIndustries}
                onViewDetails={handleOpenDetails}
              />
            </div>

            {/* Case Studies */}
            <CaseStudies caseStudies={CASE_STUDIES} />

            {/* Demo Environment */}
            <DemoEnvironment />

            {/* Build CTA */}
            <CreateStarterPackCTA />
          </div>
        }
        toolsHide={true}
      />

      <StarterPackDetailModal
        isOpen={isModalOpen}
        pack={selectedPack}
        onClose={handleCloseDetails}
      />

      <SharePointImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportItems={handleImportItems}
      />
    </>
  )
}

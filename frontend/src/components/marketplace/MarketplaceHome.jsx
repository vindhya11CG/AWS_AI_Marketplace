import React, { useMemo, useState, useEffect } from 'react'
import {
  AppLayout,
  Button,
  ColumnLayout,
  Container,
  ContentLayout,
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
          <ContentLayout header={<HeroBanner />}>
            <SpaceBetween size="l">
              <Container>
                <QuickActions />
              </Container>

              <Container header={<Header variant="h2">Starter Packs ({totalStarterPacks})</Header>}>
                AI Starter Packs are prebuilt AI workflows powered by industry-trained orchestrated
                agents. They accelerate the idea-to-production journey by turning proven use cases
                into launch-ready solutions.
              </Container>

              <Container
                header={
                  <Header
                    variant="h2"
                    actions={
                      <Button
                        variant="normal"
                        iconName="upload"
                        onClick={() => setIsImporterOpen(true)}
                      >
                        Sync SharePoint List
                      </Button>
                    }
                  >
                    Search & Filters
                  </Header>
                }
              >
                <ColumnLayout columns={2}>
                  <Select
                    selectedOption={selectedIndustry}
                    onChange={({ detail }) => setSelectedIndustry(detail.selectedOption)}
                    options={industryOptions}
                    ariaLabel="Filter by industry"
                  />
                  <TextFilter
                    filteringText={searchText}
                    filteringPlaceholder="Search starter packs"
                    filteringAriaLabel="Search starter packs"
                    onChange={({ detail }) => setSearchText(detail.filteringText)}
                  />
                </ColumnLayout>
              </Container>

              <SpaceBetween size="s">
                <Header variant="h2">Industry Catalog</Header>
                <IndustryAccordion
                  industries={filteredIndustries}
                  onViewDetails={handleOpenDetails}
                />
              </SpaceBetween>

              <DemoEnvironment />
              <CaseStudies caseStudies={CASE_STUDIES} />
              <CreateStarterPackCTA />
            </SpaceBetween>
          </ContentLayout>
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

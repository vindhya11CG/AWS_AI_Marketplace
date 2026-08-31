import React, { useMemo, useState } from 'react'
import {
  AppLayout,
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
import {
  CASE_STUDIES,
  INDUSTRIES,
  buildIndustryFilterOptions,
} from '../../data/marketplaceData'

/**
 * Filters industries by selected industry and free-text search across
 * starter pack title, description, and benefits.
 */
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

/**
 * MarketplaceHome is the AI Marketplace discovery portal.
 */
export default function MarketplaceHome({ activeHref = '#/marketplace', onNavigate }) {
  const industryOptions = useMemo(() => buildIndustryFilterOptions(), [])
  const [selectedIndustry, setSelectedIndustry] = useState(industryOptions[0])
  const [searchText, setSearchText] = useState('')

  // State for the Starter Pack Details Dialog Modal
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
    () => filterIndustries(INDUSTRIES, selectedIndustry.value, searchText),
    [selectedIndustry, searchText]
  )

  return (
    <>
      <AppLayout
        navigation={<Sidebar activeHref={activeHref} onNavigate={onNavigate} />}
        content={
          <ContentLayout header={<HeroBanner />}>
            <SpaceBetween size="l">
              {/* Quick Actions */}
              <Container>
                <QuickActions />
              </Container>

              {/* Starter Packs Introduction */}
              <Container header={<Header variant="h2">Starter Packs</Header>}>
                AI Starter Packs are prebuilt AI workflows powered by industry-trained orchestrated
                agents. They accelerate the idea-to-production journey by turning proven use cases
                into launch-ready solutions.
              </Container>

              {/* Search & Filters */}
              <Container header={<Header variant="h2">Search & Filters</Header>}>
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

              {/* Industry Catalog + Use Case Cards */}
              <SpaceBetween size="s">
                <Header variant="h2">Industry Catalog</Header>
                <IndustryAccordion
                  industries={filteredIndustries}
                  onViewDetails={handleOpenDetails}
                />
              </SpaceBetween>

              {/* Demo Environment */}
              <DemoEnvironment />

              {/* Case Studies */}
              <CaseStudies caseStudies={CASE_STUDIES} />

              {/* Create Starter Pack CTA */}
              <CreateStarterPackCTA />
            </SpaceBetween>
          </ContentLayout>
        }
        toolsHide={true}
      />

      {/* Starter Pack Details Dialog Modal */}
      <StarterPackDetailModal
        isOpen={isModalOpen}
        pack={selectedPack}
        onClose={handleCloseDetails}
      />
    </>
  )
}

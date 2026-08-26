import React from 'react'
import { Badge, ExpandableSection, SpaceBetween } from '@cloudscape-design/components'
import StarterPackCards from './StarterPackCard'

/**
 * IndustryAccordion renders each industry as an expandable section
 * containing its starter pack cards.
 *
 * Note: Cloudscape does not ship an "Accordion" component; ExpandableSection
 * is the supported primitive for accordion-style disclosure.
 *
 * @param {Object} props - Component props.
 * @param {import('../../data/marketplaceData').Industry[]} props.industries - Industries to render.
 * @param {boolean} [props.defaultExpandFirst=true] - Expand the first industry by default.
 * @returns {React.ReactElement} The industry catalog.
 */
export default function IndustryAccordion({ industries, defaultExpandFirst = true }) {
  return (
    <SpaceBetween size="s">
      {industries.map((industry, index) => (
        <ExpandableSection
          key={industry.id}
          variant="container"
          defaultExpanded={defaultExpandFirst && index === 0}
          headerText={industry.name}
          headerCounter={`(${industry.starterPacks.length})`}
        >
          <StarterPackCards starterPacks={industry.starterPacks} />
        </ExpandableSection>
      ))}
    </SpaceBetween>
  )
}

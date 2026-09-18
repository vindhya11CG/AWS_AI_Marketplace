import React from 'react'
import MarketplaceAccordion from './MarketplaceAccordion'

/**
 * DomainAccordion
 * ---------------
 * Consolidated wrapper around MarketplaceAccordion for Domain Agents.
 */
export default function DomainAccordion({
  domains,
  openMap,
  onToggleDomain,
  onViewDetails,
}) {
  return (
    <MarketplaceAccordion
      items={domains}
      openMap={openMap}
      onToggle={onToggleDomain}
      onViewDetails={onViewDetails}
      type="agents"
    />
  )
}

import React from 'react'
import MarketplaceAccordion from './MarketplaceAccordion'

/**
 * IndustryAccordion
 * -----------------
 * Consolidated wrapper around MarketplaceAccordion for Starter Packs.
 */
export default function IndustryAccordion({
  industries,
  openMap,
  onToggleIndustry,
  onViewDetails,
}) {
  return (
    <MarketplaceAccordion
      items={industries}
      openMap={openMap}
      onToggle={onToggleIndustry}
      onViewDetails={onViewDetails}
      type="starter-packs"
    />
  )
}

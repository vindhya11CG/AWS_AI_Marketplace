import React, { useState } from 'react'
import StarterPackCards from './StarterPackCard'

export default function IndustryAccordion({
  industries,
  defaultExpandFirst = true,
  onViewDetails,
}) {
  // Track open state for each industry
  const [openMap, setOpenMap] = useState(() => {
    const initial = {}
    industries.forEach((ind, index) => {
      initial[ind.id] = defaultExpandFirst && index === 0
    })
    return initial
  })

  const toggleIndustry = (id) => {
    setOpenMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <div className="industry-accordion-clean-list">
      {industries.map((industry) => {
        const isOpen = !!openMap[industry.id]
        return (
          <div key={industry.id} className="industry-accordion-clean-item">
            <button
              type="button"
              className="industry-accordion-clean-header"
              onClick={() => toggleIndustry(industry.id)}
              aria-expanded={isOpen}
            >
              <div className="industry-header-left">
                <svg
                  className={`industry-arrow-icon ${isOpen ? 'arrow-open' : ''}`}
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0073bb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                <span className="industry-header-title">{industry.name}</span>
                <span className="industry-header-count">
                  ({industry.starterPacks.length})
                </span>
              </div>
            </button>

            {isOpen && (
              <div className="industry-accordion-clean-body">
                <StarterPackCards
                  starterPacks={industry.starterPacks}
                  onViewDetails={onViewDetails}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

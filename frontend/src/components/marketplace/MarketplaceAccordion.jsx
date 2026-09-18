import React from 'react'
import StarterPackCards from './StarterPackCard'
import AgentCards from './AgentCard'

/**
 * MarketplaceAccordion
 * --------------------
 * Consolidated accordion component supporting both Industries (Starter Packs)
 * and Domains (Agents) with unified expansion toggles, item counters, and card grids.
 */
export default function MarketplaceAccordion({
  items,
  industries,
  domains,
  openMap = {},
  onToggle,
  onToggleIndustry,
  onToggleDomain,
  onViewDetails,
  type, // 'starter-packs' | 'agents'
}) {
  const list = items || industries || domains || []
  const handleToggle = onToggle || onToggleIndustry || onToggleDomain

  return (
    <div className="industry-accordion-clean-list">
      {list.map((group) => {
        const isOpen = !!openMap[group.id]
        const childItems = group.starterPacks || group.agents || group.items || []
        const isAgents = type === 'agents' || !!group.agents

        return (
          <div key={group.id} className="industry-accordion-clean-item">
            <button
              type="button"
              className="industry-accordion-clean-header"
              onClick={() => handleToggle && handleToggle(group.id)}
              aria-expanded={isOpen}
            >
              <div className="industry-header-left">
                <svg
                  className={`industry-arrow-icon ${isOpen ? 'arrow-open' : ''}`}
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                <span className="industry-header-title">{group.name}</span>
                <span className="industry-header-count">
                  ({childItems.length})
                </span>
              </div>
            </button>

            {isOpen && (
              <div className="industry-accordion-clean-body">
                {isAgents ? (
                  <AgentCards
                    agents={childItems}
                    onViewDetails={onViewDetails}
                  />
                ) : (
                  <StarterPackCards
                    starterPacks={childItems}
                    onViewDetails={onViewDetails}
                  />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

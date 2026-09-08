import React from 'react'
import AgentCards from './AgentCard'

export default function DomainAccordion({
  domains,
  openMap,
  onToggleDomain,
  onViewDetails,
}) {
  return (
    <div className="industry-accordion-clean-list">
      {domains.map((dom) => {
        const isOpen = !!openMap[dom.id]
        return (
          <div key={dom.id} className="industry-accordion-clean-item">
            <button
              type="button"
              className="industry-accordion-clean-header"
              onClick={() => onToggleDomain(dom.id)}
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
                <span className="industry-header-title">{dom.name}</span>
                <span className="industry-header-count">
                  ({dom.agents.length})
                </span>
              </div>
            </button>

            {isOpen && (
              <div className="industry-accordion-clean-body">
                <AgentCards
                  agents={dom.agents}
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

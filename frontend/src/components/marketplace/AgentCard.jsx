import React from 'react'

export default function AgentCards({ agents, onViewDetails }) {
  if (!agents || agents.length === 0) {
    return (
      <div className="starter-packs-empty">
        <p>No agents match the current filter or search criteria.</p>
      </div>
    )
  }

  return (
    <div className="starter-pack-grid-clean">
      {agents.map((agent) => (
        <div key={agent.id} className="starter-pack-card-clean agent-card-item-clean">
          <div className="pack-card-header-clean">
            <h3
              className="pack-card-title-clean"
              onClick={() => onViewDetails && onViewDetails(agent)}
            >
              {agent.title}
            </h3>
            <p className="pack-card-desc-clean">{agent.description}</p>
          </div>

          <div className="pack-card-benefits-clean">
            <span className="pack-benefits-label-clean">Business benefits</span>
            <p className="pack-benefits-text-clean">{agent.benefits}</p>
          </div>

          {agent.capabilities && agent.capabilities.length > 0 && (
            <div className="agent-capabilities-pills">
              {agent.capabilities.map((cap, i) => (
                <span key={i} className="agent-capability-tag">
                  {cap}
                </span>
              ))}
            </div>
          )}

          <div className="pack-card-tags-clean">
            <span className="pack-tag-pill-blue">{agent.domain}</span>
            <span
              className={`pack-tag-pill-demo ${
                agent.demoAvailable ? 'demo-active' : 'demo-request'
              }`}
            >
              {agent.demoAvailable ? 'Demo available' : 'Demo on request'}
            </span>
          </div>

          <div className="pack-card-actions-clean">
            <button
              type="button"
              className="btn-pack-launch-clean"
              disabled={!agent.demoAvailable}
            >
              Launch
            </button>
            <button
              type="button"
              className="btn-pack-details-clean"
              onClick={() => onViewDetails && onViewDetails(agent)}
            >
              View details
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

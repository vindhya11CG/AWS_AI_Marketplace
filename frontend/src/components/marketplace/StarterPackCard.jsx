import React from 'react'

export default function StarterPackCards({ starterPacks, onViewDetails }) {
  if (!starterPacks || starterPacks.length === 0) {
    return (
      <div className="starter-packs-empty">
        <p>No starter packs match the current filters.</p>
      </div>
    )
  }

  return (
    <div className="starter-pack-grid-clean">
      {starterPacks.map((pack) => (
        <div key={pack.id} className="starter-pack-card-clean">
          <div className="pack-card-header-clean">
            <h3
              className="pack-card-title-clean"
              onClick={() => onViewDetails && onViewDetails(pack)}
            >
              {pack.title}
            </h3>
            <p className="pack-card-desc-clean">{pack.description}</p>
          </div>

          <div className="pack-card-benefits-clean">
            <span className="pack-benefits-label-clean">Business benefits</span>
            <p className="pack-benefits-text-clean">{pack.benefits}</p>
          </div>

          <div className="pack-card-tags-clean">
            <span className="pack-tag-pill-blue">{pack.category}</span>
            <span
              className={`pack-tag-pill-demo ${
                pack.demoAvailable ? 'demo-active' : 'demo-request'
              }`}
            >
              {pack.demoAvailable ? 'Demo available' : 'Demo on request'}
            </span>
          </div>

          <div className="pack-card-actions-clean">
            <button
              type="button"
              className="btn-pack-launch-clean"
              disabled={!pack.demoAvailable}
            >
              Launch
            </button>
            <button
              type="button"
              className="btn-pack-details-clean"
              onClick={() => onViewDetails && onViewDetails(pack)}
            >
              View details
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

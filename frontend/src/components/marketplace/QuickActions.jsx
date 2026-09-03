import React from 'react'

export default function QuickActions({
  onBrowseStarterPacks,
  onBrowseAgents,
  onCreateStarterPack,
  onContactUs,
}) {
  return (
    <div className="quick-actions-bar-pure">
      <button
        type="button"
        className="btn-quick-blue"
        onClick={onBrowseStarterPacks}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        Starter Packs
      </button>

      <button
        type="button"
        className="btn-quick-blue"
        onClick={onBrowseAgents}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
        </svg>
        Agents
      </button>

      <button
        type="button"
        className="btn-quick-blue"
        onClick={onCreateStarterPack}
      >
        Create Your Own Starter Pack ▾
      </button>

      <button
        type="button"
        className="btn-quick-blue"
        onClick={onContactUs}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
        Contact Us
      </button>
    </div>
  )
}

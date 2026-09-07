import React, { useState } from 'react'

export default function StarterPackDetailModal({ isOpen, pack, onClose }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [userRating, setUserRating] = useState(0)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')

  if (!isOpen || !pack) return null

  const isAgent = !!pack.domain && !pack.industry
  const title = pack.title || 'Item Details'
  const category = pack.category || pack.domain || 'Operational Excellence'
  const description = pack.description || ''
  const benefits = pack.benefits || ''
  const ratings = pack.ratings || { score: 4.8, count: 12 }
  const availability = pack.availability || ['Amplifier for Agentic Experience', 'AWS Bedrock Agentic Core']

  const handleAddComment = (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setComments([
      { text: newComment.trim(), author: 'You (Current User)', created: 'Just now' },
      ...comments,
    ])
    setNewComment('')
  }

  return (
    <div className="starter-modal-overlay" onClick={onClose}>
      <div className="starter-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="starter-modal-header">
          <div className="modal-header-top">
            <span className="modal-category-badge">{category}</span>
            <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
          <h2 className="modal-pack-title">{title}</h2>
          <p className="modal-pack-tagline">{pack.tagline || benefits}</p>

          {/* Modal Tabs */}
          <div className="modal-nav-tabs">
            <button
              type="button"
              className={`modal-tab-btn ${activeTab === 'overview' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              type="button"
              className={`modal-tab-btn ${activeTab === 'business' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('business')}
            >
              Business Impact
            </button>
            <button
              type="button"
              className={`modal-tab-btn ${activeTab === 'technical' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('technical')}
            >
              Technical & Integration
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="starter-modal-body">
          {activeTab === 'overview' && (
            <div className="modal-tab-content">
              <div className="modal-section">
                <h4 className="modal-section-title">Description</h4>
                <p className="modal-text">{description}</p>
              </div>

              {pack.problemSolved && (
                <div className="modal-section">
                  <h4 className="modal-section-title">Problem Solved</h4>
                  <p className="modal-text">{pack.problemSolved}</p>
                </div>
              )}

              {pack.capabilities && (
                <div className="modal-section">
                  <h4 className="modal-section-title">Core Capabilities</h4>
                  <div className="modal-capabilities-grid">
                    {pack.capabilities.map((cap, i) => (
                      <div key={i} className="capability-item-card">
                        <span className="capability-dot">✓</span>
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pack.agentPipeline && (
                <div className="modal-section">
                  <h4 className="modal-section-title">Agent Pipeline Architecture</h4>
                  <div className="pipeline-steps-list">
                    {pack.agentPipeline.map((agent, i) => (
                      <div key={i} className="pipeline-step-item">
                        <span className="step-num">{i + 1}</span>
                        <div>
                          <strong className="step-agent-name">{agent.name}</strong>
                          <p className="step-agent-role">{agent.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-section">
                <h4 className="modal-section-title">Platform Availability</h4>
                <div className="availability-pills-row">
                  {availability.map((plat, i) => (
                    <span key={i} className="avail-pill">
                      {plat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'business' && (
            <div className="modal-tab-content">
              <div className="modal-section">
                <h4 className="modal-section-title">Quantifiable Business Benefits</h4>
                <p className="modal-text">{benefits}</p>
              </div>

              {pack.roiMetrics ? (
                <div className="modal-section">
                  <h4 className="modal-section-title">Expected ROI & Efficiency Gains</h4>
                  <div className="roi-metrics-grid">
                    <div className="roi-metric-box">
                      <span className="roi-metric-val">{pack.roiMetrics.timeSavings}</span>
                      <span className="roi-metric-lbl">{pack.roiMetrics.timeLabel}</span>
                    </div>
                    <div className="roi-metric-box">
                      <span className="roi-metric-val">{pack.roiMetrics.costSavings}</span>
                      <span className="roi-metric-lbl">{pack.roiMetrics.costLabel}</span>
                    </div>
                  </div>
                  <p className="roi-summary-note">{pack.roiMetrics.summary}</p>
                </div>
              ) : (
                <div className="modal-section">
                  <h4 className="modal-section-title">Target Operational Outcomes</h4>
                  <p className="modal-text">
                    Engineered for autonomous task execution, eliminating manual handoffs and delivering compliance auditability.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'technical' && (
            <div className="modal-tab-content">
              <div className="modal-section">
                <h4 className="modal-section-title">API & Orchestration Architecture</h4>
                <div className="tech-spec-box">
                  <div className="tech-spec-row">
                    <span className="tech-spec-key">Runtime:</span>
                    <span className="tech-spec-val">Amplifier Agentic Core / Bedrock Agent Framework</span>
                  </div>
                  <div className="tech-spec-row">
                    <span className="tech-spec-key">Protocol:</span>
                    <span className="tech-spec-val">REST / WebSocket Streaming / Async Event-Bridge</span>
                  </div>
                  <div className="tech-spec-row">
                    <span className="tech-spec-key">Security & Governance:</span>
                    <span className="tech-spec-val">SOC-2 Type II, HIPAA-Ready, Zero-Data-Retention Enforced</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ratings & Comments Section */}
          <div className="modal-ratings-comments-section">
            <div className="ratings-bar">
              <div className="star-display">
                <span className="star-rating-score">★ {ratings.score} / 5</span>
                <span className="star-count">({ratings.count} ratings)</span>
              </div>
              <div className="rate-interactive">
                <span className="rate-prompt">Rate this solution:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${userRating >= star ? 'star-active' : ''}`}
                    onClick={() => setUserRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="comments-wrapper">
              <h4 className="comments-title">Peer Discussions & Feedback ({comments.length + (pack.comments?.length || 0)})</h4>
              <form onSubmit={handleAddComment} className="comment-form">
                <input
                  type="text"
                  placeholder="Add your feedback or implementation notes..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="comment-input"
                />
                <button type="submit" className="comment-submit-btn">
                  Post
                </button>
              </form>

              <div className="comments-list">
                {[...comments, ...(pack.comments || [])].map((comm, i) => (
                  <div key={i} className="comment-bubble">
                    <div className="comment-bubble-header">
                      <strong>{comm.author}</strong>
                      <span>{comm.created}</span>
                    </div>
                    <p>{comm.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="starter-modal-footer">
          <button type="button" className="btn-modal-close" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn-modal-launch"
            disabled={!pack.demoAvailable}
          >
            Launch in Workspace ↗
          </button>
        </div>
      </div>
    </div>
  )
}

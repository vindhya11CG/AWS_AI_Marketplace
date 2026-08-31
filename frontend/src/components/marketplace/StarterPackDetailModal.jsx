import React, { useState, useEffect, useRef } from 'react'
import '../../styles/StarterPackDetailModal.css'

export default function StarterPackDetailModal({ isOpen, pack, onClose }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [commentsCollapsed, setCommentsCollapsed] = useState(false)
  const [commentsList, setCommentsList] = useState([])
  const [commentText, setCommentText] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    if (pack?.comments) {
      setCommentsList(pack.comments)
    } else {
      setCommentsList([])
    }
    setActiveTab('overview')
    setIsPlaying(false)
  }, [pack])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !pack) return null

  const handlePostComment = (e) => {
    e.preventDefault()
    if (!commentText.trim()) return

    const newComment = {
      id: Date.now(),
      author: 'You (Current User)',
      time: 'Just now',
      text: commentText.trim(),
    }

    setCommentsList((prev) => [...prev, newComment])
    setCommentText('')
  }

  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
        setIsPlaying(true)
      } else {
        videoRef.current.pause()
        setIsPlaying(false)
      }
    }
  }

  const handleOpenLink = (url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const renderQuickLinkIcon = (type) => {
    switch (type) {
      case 'video':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )
      case 'deck':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        )
      case 'workflow':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M2 12h5l3 7 4-14 3 7h5" />
          </svg>
        )
      case 'file':
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        )
    }
  }

  return (
    <div className="starter-pack-modal-backdrop" onClick={onClose}>
      <div
        className="starter-pack-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Top Right Red Close Button */}
        <button
          type="button"
          className="modal-close-red-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ✕
        </button>

        {/* Modal Top Header */}
        <div className="modal-header-section">
          <div className="modal-header-text">
            <h1 className="modal-main-title">{pack.title}</h1>
            <p className="modal-subtitle-tagline">{pack.tagline || pack.description}</p>
          </div>

          <div className="modal-header-actions">
            <button
              type="button"
              className="btn-agentic-link"
              onClick={() => handleOpenLink(pack.agenticLinkUrl || 'https://agenticexperience.azurewebsites.net/login')}
              title="Open Agentic Experience Portal"
            >
              <span className="agentic-wave-icon">∿</span> Agentic Link
            </button>
          </div>
        </div>

        {/* Two-Column Main Body */}
        <div className="modal-body-columns">
          {/* =========================================
              LEFT COLUMN (~63% width)
             ========================================= */}
          <div className="modal-left-column">
            {/* Embedded Video / Media Player */}
            <div className="modal-video-container">
              <div className="video-mockup-wrapper">
                {pack.videoUrl ? (
                  <video
                    ref={videoRef}
                    src={pack.videoUrl}
                    poster="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80"
                    controls
                    className="video-player-element"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80"
                    alt="AI Avatar Presenter"
                    className="video-presenter-img"
                  />
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="modal-tabs-nav">
              <button
                type="button"
                className={`tab-item-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                type="button"
                className={`tab-item-btn ${activeTab === 'agent-workflow' ? 'active' : ''}`}
                onClick={() => setActiveTab('agent-workflow')}
              >
                Agent Workflow
              </button>
              <button
                type="button"
                className={`tab-item-btn ${activeTab === 'integration' ? 'active' : ''}`}
                onClick={() => setActiveTab('integration')}
              >
                Integration
              </button>
            </div>

            <div className="modal-tab-divider" />

            {/* Tab Content Panes */}
            <div className="modal-tab-content-area">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="tab-pane-overview">
                  <div className="overview-section-block">
                    <h3 className="section-heading-blue">Problem Solved</h3>
                    <p className="section-body-text">
                      {pack.problemSolved ||
                        'Manual checks, disparate data sources, and repetitive human reviews create severe turnaround delays and operational overhead.'}
                    </p>
                  </div>

                  <div className="overview-section-block">
                    <h3 className="section-heading-blue">Description</h3>
                    <p className="section-body-text">
                      {pack.solutionDescription || pack.description}
                    </p>
                  </div>

                  <div className="overview-section-block">
                    <h3 className="section-heading-blue">Industry</h3>
                    <p className="section-body-text">{pack.industry || pack.category}</p>
                  </div>
                </div>
              )}

              {/* TAB 2: AGENT WORKFLOW */}
              {activeTab === 'agent-workflow' && (
                <div className="tab-pane-workflow">
                  <div className="agent-pipeline-flow">
                    {pack.agentPipeline && pack.agentPipeline.length > 0 ? (
                      pack.agentPipeline.map((agent, index) => (
                        <div key={index} className="agent-step-row-wrapper">
                          <div className="agent-step-row">
                            <span className="agent-pill-badge">{agent.name}</span>
                            <span className="agent-role-desc">[{agent.role}]</span>
                          </div>
                          {index < pack.agentPipeline.length - 1 && (
                            <div className="agent-step-down-arrow">↓</div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="empty-agents-text">
                        No agent pipeline defined for this starter pack.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: INTEGRATION */}
              {activeTab === 'integration' && (
                <div className="tab-pane-integration">
                  <div className="overview-section-block">
                    <h3 className="section-heading-blue">Availability</h3>
                    <p className="section-body-text">
                      {pack.availability ? pack.availability.join(', ') : 'Amplifier for Agentic Experience, AWS Bedrock, Amplifier for Foundations'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =========================================
              RIGHT COLUMN (~35% width)
             ========================================= */}
          <div className="modal-right-column">
            {/* Widget 1: Expected ROI Metrics */}
            <div className="modal-widget-card roi-widget-card">
              <h3 className="widget-title">Expected ROI Metrics</h3>
              <div className="roi-metrics-grid">
                <div className="roi-metric-box">
                  <div className="roi-value-large">{pack.roiMetrics?.timeSavings || '~60%'}</div>
                  <div className="roi-label-small">{pack.roiMetrics?.timeLabel || 'time-to-approval'}</div>
                </div>
                <div className="roi-metric-box">
                  <div className="roi-value-large">{pack.roiMetrics?.costSavings || '~35%'}</div>
                  <div className="roi-label-small">{pack.roiMetrics?.costLabel || 'cost'}</div>
                </div>
              </div>
              <p className="roi-summary-text">
                {pack.roiMetrics?.summary || 'Speeds approvals, reduces errors, and boosts customer experience.'}
              </p>
            </div>

            {/* Widget 2: Ratings */}
            <div className="modal-widget-card ratings-widget-card">
              <h3 className="widget-title">Ratings</h3>
              <div className="ratings-stars-row">
                <div className="stars-cluster">
                  {'★★★★★'.split('').map((star, i) => (
                    <span key={i} className="star-filled">
                      {star}
                    </span>
                  ))}
                </div>
                <div className="rating-score-fraction">
                  {pack.ratings?.score || 5} / {pack.ratings?.maxScore || 5}
                </div>
              </div>
              <div className="ratings-count-label">
                {pack.ratings?.count || 9} ratings
              </div>
            </div>

            {/* Widget 3: Quick Links (Clickable) */}
            <div className="modal-widget-card quick-links-card">
              <h3 className="widget-title">Quick Links</h3>
              <div className="quick-links-stack">
                {pack.quickLinks?.map((link) => (
                  <button
                    key={link.id}
                    type="button"
                    className="btn-quick-link"
                    onClick={() => handleOpenLink(link.url)}
                    title={`Open ${link.label}`}
                  >
                    <span className="quick-link-icon">{renderQuickLinkIcon(link.icon)}</span>
                    <span className="quick-link-text">{link.label}</span>
                    <span className="quick-link-arrow">↗</span>
                  </button>
                )) || (
                  <>
                    <button
                      type="button"
                      className="btn-quick-link"
                      onClick={() => handleOpenLink('https://sogeti.navattic.com/flowofagenticsystem?g=cmgg9vmwh000004lccfo0cg8o&s=0')}
                    >
                      <span className="quick-link-icon">{renderQuickLinkIcon('video')}</span>
                      <span className="quick-link-text">Click Through Demo</span>
                      <span className="quick-link-arrow">↗</span>
                    </button>
                    <button
                      type="button"
                      className="btn-quick-link"
                      onClick={() => handleOpenLink('https://capgemini.sharepoint.com/sites/KnowNow/_layouts/15/viewer.aspx?sourcedoc={e4cede9f-c8e8-403d-b63f-0f7a14e3ce85}')}
                    >
                      <span className="quick-link-icon">{renderQuickLinkIcon('deck')}</span>
                      <span className="quick-link-text">Pitch Deck</span>
                      <span className="quick-link-arrow">↗</span>
                    </button>
                    <button
                      type="button"
                      className="btn-quick-link"
                      onClick={() => handleOpenLink('https://capgemini.sharepoint.com/sites/KnowNow/AIMarketplace/SitePages/Workflow-Instructions.aspx')}
                    >
                      <span className="quick-link-icon">{renderQuickLinkIcon('workflow')}</span>
                      <span className="quick-link-text">Workflow Setup Instructions</span>
                      <span className="quick-link-arrow">↗</span>
                    </button>
                    <button
                      type="button"
                      className="btn-quick-link"
                      onClick={() => handleOpenLink('https://capgemini.sharepoint.com/sites/KnowNow/AIMarketplace/SiteAssets/Sample_Loan_Application_Data.csv')}
                    >
                      <span className="quick-link-icon">{renderQuickLinkIcon('file')}</span>
                      <span className="quick-link-text">Sample Input File</span>
                      <span className="quick-link-arrow">↗</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Widget 4: Comments Section */}
            <div className="modal-widget-card comments-widget-card">
              <div
                className="comments-header-row"
                onClick={() => setCommentsCollapsed(!commentsCollapsed)}
              >
                <h3 className="widget-title" style={{ margin: 0 }}>Comments</h3>
                <button
                  type="button"
                  className="comments-collapse-toggle-btn"
                  aria-label="Toggle comments"
                >
                  {commentsCollapsed ? '+' : '-'}
                </button>
              </div>

              {!commentsCollapsed && (
                <div className="comments-body-wrapper">
                  {commentsList.length === 0 ? (
                    <div className="no-comments-placeholder">No comments yet</div>
                  ) : (
                    <div className="comments-stream-list">
                      {commentsList.map((comm) => (
                        <div key={comm.id} className="single-comment-item">
                          <div className="comment-meta">
                            <span className="comment-author">{comm.author}</span>
                            <span className="comment-time">{comm.time}</span>
                          </div>
                          <p className="comment-text">{comm.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handlePostComment} className="comment-input-form">
                    <textarea
                      className="comment-textarea"
                      placeholder="Write a comment..."
                      rows="2"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <div className="comment-submit-row">
                      <button type="submit" className="btn-post-comment">
                        Post
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

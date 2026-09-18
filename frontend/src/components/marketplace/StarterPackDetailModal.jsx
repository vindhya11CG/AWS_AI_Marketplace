import React, { useState, useRef, useEffect, useCallback } from 'react'
import { marketplaceService } from '../../services/marketplaceService'

/**
 * SimpleVideoPlayer
 * -----------------
 * Consolidated inline AWS Cloudscape styled video player component.
 * - Sits directly on the starter pack modal / page (no redirection).
 * - Click anywhere on the video space or video element to play or pause.
 * - Dynamic Cloudscape UI/UX actions: play/pause, scrubber timeline, volume,
 *   playback speed, fullscreen, and animated feedback.
 * - Reliable state management ensures pausing stays paused.
 */
export function SimpleVideoPlayer({
  videoUrl,
  title,
  duration = '1:45',
  autoplay = false,
}) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const controlsTimeoutRef = useRef(null)
  const autoplayFiredRef = useRef(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [durationSec, setDurationSec] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [actionFeedback, setActionFeedback] = useState(null) // 'play' | 'pause'
  const [currentSrc, setCurrentSrc] = useState(videoUrl)
  const [isFallback, setIsFallback] = useState(false)

  // Fallback demo stream for local environments where SharePoint CORS prevents raw playback
  const FALLBACK_STREAM =
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

  // Reset states when the target videoUrl changes
  useEffect(() => {
    setCurrentSrc(videoUrl || FALLBACK_STREAM)
    setIsFallback(false)
    setIsPlaying(false)
    setCurrentTime(0)
    autoplayFiredRef.current = false
  }, [videoUrl])

  // Execute autoplay ONCE per pack if requested
  useEffect(() => {
    if (autoplay && !autoplayFiredRef.current && videoRef.current) {
      autoplayFiredRef.current = true
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
          })
          .catch(() => {
            // If sound autoplay is restricted, try muted
            if (videoRef.current) {
              videoRef.current.muted = true
              setIsMuted(true)
              videoRef.current
                .play()
                .then(() => setIsPlaying(true))
                .catch(() => {})
            }
          })
      }
    }
  }, [autoplay, currentSrc])

  // Click on video space to toggle play/pause
  const togglePlay = useCallback((e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation()
    }

    const v = videoRef.current
    if (!v) return

    if (v.paused || v.ended) {
      const p = v.play()
      if (p !== undefined) {
        p.then(() => {
          setIsPlaying(true)
          setActionFeedback('play')
          setTimeout(() => setActionFeedback(null), 500)
        }).catch((err) => {
          console.warn('Playback error, falling back to demo stream:', err)
          if (!isFallback) {
            setIsFallback(true)
            setCurrentSrc(FALLBACK_STREAM)
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
              }
            }, 100)
          }
        })
      }
    } else {
      v.pause()
      setIsPlaying(false)
      setActionFeedback('pause')
      setTimeout(() => setActionFeedback(null), 500)
    }
  }, [isFallback])

  // Time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  // Loaded metadata
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDurationSec(videoRef.current.duration || 0)
    }
  }

  // Video error fallback handling without redirecting or breaking player
  const handleVideoError = () => {
    console.info('[SimpleVideoPlayer] Primary video source blocked by CORS/Auth. Using demo stream fallback.')
    if (!isFallback) {
      setIsFallback(true)
      setCurrentSrc(FALLBACK_STREAM)
    }
  }

  // Scrubbing / Seek
  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
  }

  // Volume change
  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value)
    setVolume(newVol)
    setIsMuted(newVol === 0)
    if (videoRef.current) {
      videoRef.current.volume = newVol
      videoRef.current.muted = newVol === 0
    }
  }

  // Mute toggle
  const toggleMute = () => {
    if (videoRef.current) {
      const nextMute = !isMuted
      setIsMuted(nextMute)
      videoRef.current.muted = nextMute
    }
  }

  // Playback rate
  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2]
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length
    const nextRate = rates[nextIdx]
    setPlaybackRate(nextRate)
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate
    }
  }

  // Fullscreen
  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen()
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen()
      }
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
      setIsFullscreen(false)
    }
  }

  // Auto-hide controls when playing
  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 2500)
    }
  }

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div
      ref={containerRef}
      className={`simple-video-player-component ${isFullscreen ? 'player-fullscreen' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Top Bar Overlay - Title, Badge, Duration (No Linked: text) */}
      <div className={`player-top-bar ${showControls ? 'visible' : ''}`}>
        <div className="player-title-info">
          <span className="player-badge-pill">🎬 Solution Demo</span>
          <span className="player-item-title">{title}</span>
          {duration && <span className="player-duration-pill">{duration}</span>}
        </div>
      </div>

      {/* Main Video Element - Click anywhere on the video space to play/pause */}
      <div className="player-video-space" onClick={togglePlay}>
        <video
          ref={videoRef}
          className="player-video-element"
          src={currentSrc}
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleVideoError}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
        />

        {/* Dynamic Center Play Button when paused */}
        {!isPlaying && (
          <button
            type="button"
            className="player-center-play-btn"
            aria-label="Play video"
            onClick={togglePlay}
          >
            <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}

        {/* Center Animated Feedback Ripple on click */}
        {actionFeedback && (
          <div className="player-action-feedback-ripple">
            {actionFeedback === 'play' ? (
              <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Bottom Cloudscape Controls Bar */}
      <div
        className={`player-bottom-controls ${showControls || !isPlaying ? 'visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Timeline Scrubber */}
        <div className="player-timeline-wrapper">
          <input
            type="range"
            min="0"
            max={durationSec || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="player-timeline-slider"
            style={{
              background: `linear-gradient(to right, #0972d3 ${
                durationSec ? (currentTime / durationSec) * 100 : 0
              }%, rgba(255,255,255,0.2) ${
                durationSec ? (currentTime / durationSec) * 100 : 0
              }%)`,
            }}
          />
        </div>

        {/* Action Controls Row */}
        <div className="player-controls-row">
          {/* Left Actions: Play/Pause, Volume, Time */}
          <div className="player-controls-left">
            <button
              type="button"
              className="player-control-btn"
              onClick={togglePlay}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <div className="player-volume-group">
              <button
                type="button"
                className="player-control-btn"
                onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="player-volume-slider"
                title="Volume"
              />
            </div>

            <span className="player-time-display">
              {formatTime(currentTime)} / {formatTime(durationSec || 105)}
            </span>
          </div>

          {/* Right Actions: Speed, Fullscreen */}
          <div className="player-controls-right">
            <button
              type="button"
              className="player-speed-btn"
              onClick={cyclePlaybackRate}
              title="Playback Speed"
            >
              {playbackRate}x
            </button>

            <button
              type="button"
              className="player-control-btn"
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-14v3h3v2h-5V5h2z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * StarterPackDetailModal
 * ----------------------
 * Primary modal component displaying starter pack specifications,
 * the integrated SimpleVideoPlayer, interactive ratings, comments, and ROI metrics.
 */
export default function StarterPackDetailModal({ isOpen, pack, onClose, autoplay = false }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [userRating, setUserRating] = useState(0)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    if (!isOpen || !pack) {
      return
    }
    setActiveTab('overview')
  }, [isOpen, pack])

  if (!isOpen || !pack) return null

  const isAgent = !!pack.domain && !pack.industry
  const title = pack.title || 'Item Details'
  const category = pack.category || pack.domain || 'Operational Excellence'
  const description = pack.description || ''
  const benefits = pack.benefits || ''
  const ratings = pack.ratings || { score: 4.8, count: 12 }
  const availability = pack.availability || ['Amplifier for Agentic Experience', 'AWS Bedrock Agentic Core']
  const videoSrc = pack.videoUrl || (pack.demoAvailable ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' : null)

  const handleRatingClick = (star) => {
    setUserRating(star)
    if (pack.id) {
      marketplaceService.submitRating(pack.id, star).catch((e) => console.warn('Could not post rating', e))
    }
  }

  const handleAddComment = (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    const commentObj = { text: newComment.trim(), author: 'You (Current User)', created: 'Just now' }
    setComments([commentObj, ...comments])
    if (pack.id) {
      marketplaceService.submitComment(pack.id, newComment.trim(), 'You (Current User)').catch((err) => console.warn('Could not post comment', err))
    }
    setNewComment('')
  }

  try {
    return (
      <div className="starter-modal-overlay" onClick={onClose}>
        <div
          className="starter-modal-container"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* Modal Header */}
          <div className="starter-modal-header">
            <div className="modal-header-top-row">
              <span className="modal-category-badge">{category}</span>
              <button
                type="button"
                className="modal-close-btn"
                onClick={onClose}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-title-row">
              <h2 className="modal-pack-title">{title}</h2>
              {pack.agenticLinkUrl && (
                <a
                  href={pack.agenticLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-agentic-link-clean"
                >
                  Agentic link ↗
                </a>
              )}
            </div>

            {/* Navigation Tabs */}
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
                Technical Integration
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="starter-modal-body">
            {activeTab === 'overview' && (
              <div className="modal-tab-content">
                {/* Consolidated Simple Video Player component window directly in the modal */}
                {videoSrc && (
                  <div className="modal-video-section-wrapper">
                    <SimpleVideoPlayer
                      videoUrl={videoSrc}
                      title={title}
                      duration={pack.duration || '1:45'}
                      autoplay={autoplay}
                    />
                  </div>
                )}

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
                    <h4 className="modal-section-title">Agentic Workflow</h4>
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
                  <h4 className="modal-section-title">Deployment Availability</h4>
                  <div className="modal-tags-row">
                    {availability.map((env, i) => (
                      <span key={i} className="availability-pill">
                        {env}
                      </span>
                    ))}
                  </div>
                </div>

                {Array.isArray(pack.quickLinks) && pack.quickLinks.length > 0 && (
                  <div className="modal-section">
                    <h4 className="modal-section-title">Artifacts & Quick Links</h4>
                    <div className="modal-quick-links-grid">
                      {pack.quickLinks.map((link) => (
                        <a
                          key={link.id || link.label}
                          href={link.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="quick-link-card"
                        >
                          <span>{link.icon === 'video' ? '🎬' : link.icon === 'deck' ? '📊' : link.icon === 'workflow' ? '⚙️' : '📄'}</span>
                          <span>{link.label}</span>
                          <span style={{ marginLeft: 'auto' }}>↗</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'business' && (
              <div className="modal-tab-content">
                <div className="modal-section">
                  <h4 className="modal-section-title">Business Benefits</h4>
                  <p className="modal-text">{benefits}</p>
                </div>

                {pack.roiMetrics && (
                  <div className="modal-section">
                    <h4 className="modal-section-title">Expected ROI Metrics</h4>
                    <div className="roi-metrics-grid">
                      {pack.roiMetrics.timeSavings && (
                        <div className="roi-card">
                          <span className="roi-number">{pack.roiMetrics.timeSavings}</span>
                          <span className="roi-label">{pack.roiMetrics.timeLabel || 'Time Savings'}</span>
                        </div>
                      )}
                      {pack.roiMetrics.costSavings && (
                        <div className="roi-card">
                          <span className="roi-number">{pack.roiMetrics.costSavings}</span>
                          <span className="roi-label">{pack.roiMetrics.costLabel || 'Cost Reduction'}</span>
                        </div>
                      )}
                    </div>
                    {pack.roiMetrics.summary && (
                      <p className="roi-summary-note">{pack.roiMetrics.summary}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'technical' && (
              <div className="modal-tab-content">
                <div className="modal-section">
                  <h4 className="modal-section-title">Solution Description</h4>
                  <p className="modal-text">
                    {pack.solutionDescription ||
                      'Automates end-to-end multi-agent orchestration, ingestion validation, and compliance checking using AWS Bedrock and Lambda serverless integrations.'}
                  </p>
                </div>

                <div className="modal-section">
                  <h4 className="modal-section-title">Security & Governance</h4>
                  <p className="modal-text">
                    Enterprise SOC2, HIPAA, and GDPR-compliant processing pipeline with IAM least-privilege role separation and private S3 curated zone storage.
                  </p>
                </div>
              </div>
            )}

            {/* Ratings & Community Feedback Widget */}
            <div className="modal-bottom-feedback-section">
              <div className="feedback-rating-box">
                <span className="feedback-heading">Ratings & Reviews</span>
                <div className="stars-row-interactive">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${star <= (userRating || Math.round(ratings.score || 5)) ? 'star-lit' : ''}`}
                      onClick={() => handleRatingClick(star)}
                    >
                      ★
                    </button>
                  ))}
                  <span className="rating-score-text">
                    {ratings.score || 5.0} ({ratings.count || 10} ratings)
                  </span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="feedback-comments-box">
                <span className="feedback-heading">Team Feedback</span>
                <form onSubmit={handleAddComment} className="comment-input-row">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a question or comment for the solution architect..."
                    className="comment-input-field"
                  />
                  <button type="submit" className="btn-post-comment">
                    Post
                  </button>
                </form>

                <div className="comments-stream">
                  {comments.map((c, i) => (
                    <div key={i} className="comment-bubble">
                      <div className="comment-meta">
                        <span className="comment-author">{c.author}</span>
                        <span className="comment-time">{c.created}</span>
                      </div>
                      <p className="comment-body">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="starter-modal-footer">
            <button
              type="button"
              className="btn-modal-close"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className="btn-modal-launch"
              onClick={() => {
                // Future: Workflow link redirect to external platform
              }}
            >
              Launch in Workspace ↗
            </button>
          </div>
        </div>
      </div>
    )
  } catch (err) {
    console.error('Error rendering StarterPackDetailModal:', err)
    return null
  }
}

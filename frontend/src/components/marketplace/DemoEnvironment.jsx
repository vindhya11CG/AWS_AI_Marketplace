import React from 'react'

export default function DemoEnvironment({ onLaunchDemo, onGuestLogin }) {
  return (
    <div className="clean-section-card-box">
      <div className="clean-card-box-header">
        <h2 className="clean-card-box-title">Demo Environment</h2>
        <p className="clean-card-box-desc">
          Try the platform hands-on before you build.
        </p>
      </div>
      <div className="clean-card-box-content">
        <p className="clean-card-box-text">
          Explore the Agentic Experience demo, sign in as a guest, and review the platform guide to get started quickly.
        </p>
        <div className="clean-card-box-actions">
          <button
            type="button"
            className="btn-primary-blue-pill"
            onClick={onLaunchDemo}
          >
            Agentic Experience Demo
          </button>
          <button
            type="button"
            className="btn-primary-blue-pill"
            onClick={onGuestLogin}
          >
            Guest Login
          </button>
          <a href="#/platform-guide" className="btn-link-blue">
            Platform Guide / How-To ↗
          </a>
        </div>
      </div>
    </div>
  )
}

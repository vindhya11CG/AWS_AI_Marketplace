import React from 'react'

export default function CreateStarterPackCTA({ onCreate, onContact }) {
  return (
    <div className="clean-section-card-box">
      <div className="clean-card-box-header-flex">
        <div>
          <h2 className="clean-card-box-title">Build Your Own Starter Pack</h2>
          <p className="clean-card-box-desc">
            Have a use case in mind? Package it into a reusable starter pack.
          </p>
        </div>
        <div className="clean-header-actions-row">
          <button
            type="button"
            className="btn-primary-blue-pill"
            onClick={onCreate}
          >
            + Create Starter Pack
          </button>
          <button
            type="button"
            className="btn-primary-blue-pill"
            onClick={onContact}
          >
            Contact Us
          </button>
        </div>
      </div>
      <div className="clean-card-box-content">
        <p className="clean-card-box-text">
          Combine industry-trained orchestrated agents into a prebuilt workflow and accelerate your clients' idea-to-production journey.
        </p>
      </div>
    </div>
  )
}

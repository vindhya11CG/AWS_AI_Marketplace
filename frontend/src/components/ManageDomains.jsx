import React, { useState } from 'react'
import {
  AppLayout,
  Box,
  SpaceBetween,
  Flashbar,
} from '@cloudscape-design/components'
import Sidebar from './Sidebar'
import '../styles/ManageDomains.css'

export default function ManageDomains({
  domains,
  onAddDomain,
  onSelectDomain,
  activeHref = '#/domains',
  onNavigate,
}) {
  const [createCollapsed, setCreateCollapsed] = useState(false)
  const [existingCollapsed, setExistingCollapsed] = useState(false)

  // Form State
  const [domainName, setDomainName] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [flashMessages, setFlashMessages] = useState([])

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...selectedFiles])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files)
      setFiles((prev) => [...prev, ...droppedFiles])
    }
  }

  const removeFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!domainName.trim()) {
      setFlashMessages([
        {
          type: 'error',
          content: 'Please enter a domain name.',
          dismissible: true,
          id: 'error-name',
          onDismiss: () => setFlashMessages([]),
        },
      ])
      return
    }

    const newDomain = {
      id: domainName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      title: domainName.trim(),
      seller: 'Custom Domain',
      status: 'Inactive',
      workflowCount: 0,
      rating: 5.0,
      ratingCount: 1,
      badge: 'Deployed on AWS',
      logo: '📁',
      description: description.trim() || 'Custom created domain for specific business operations.',
      stats: { completed: 0, running: 0, pending: 0 },
      recentWorkflows: [],
      knowledgeFiles: files.map((f) => f.name),
    }

    onAddDomain(newDomain)

    // Reset Form
    setDomainName('')
    setDescription('')
    setFiles([])

    // Success Notification
    setFlashMessages([
      {
        type: 'success',
        content: `Domain "${newDomain.title}" created successfully!`,
        dismissible: true,
        id: 'success-add',
        onDismiss: () => setFlashMessages([]),
      },
    ])
  }

  return (
    <AppLayout
      navigation={<Sidebar activeHref={activeHref} onNavigate={onNavigate} />}
      content={
        <div className="manage-domains-page">
          {flashMessages.length > 0 && (
            <div className="flashbar-wrapper">
              <Flashbar items={flashMessages} />
            </div>
          )}

          {/* Page Heading */}
          <div className="manage-domains-header">
            <h1 className="manage-domains-title">Manage Domains</h1>
            <p className="manage-domains-subtitle">
              Create new domains or manage existing ones to guide your agentic workflows.
            </p>
          </div>

          <SpaceBetween size="l" direction="vertical">
            {/* Section 1: Create New Domain Card */}
            <div className="custom-accordion-card">
              <div
                className="accordion-header"
                onClick={() => setCreateCollapsed(!createCollapsed)}
              >
                <span className="accordion-title">Create New Domain</span>
                <span className={`accordion-arrow ${createCollapsed ? 'collapsed' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </span>
              </div>

              {!createCollapsed && (
                <div className="accordion-body">
                  <form onSubmit={handleSubmit}>
                    {/* Domain Name */}
                    <div className="form-group">
                      <label className="form-label">
                        Domain Name <span className="required-star">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., Healthcare Claims Processing"
                        value={domainName}
                        onChange={(e) => setDomainName(e.target.value)}
                        required
                      />
                    </div>

                    {/* Describe Industry/Domain */}
                    <div className="form-group">
                      <label className="form-label">
                        Describe your Industry/Domain <span className="required-star">*</span>
                        <span
                          className="info-icon"
                          title="Provide details about the industry, common terminologies, specific processes, etc."
                        >
                          ⓘ
                        </span>
                      </label>
                      <textarea
                        className="form-textarea"
                        placeholder="Provide details about the industry, common terminologies, specific processes, etc."
                        rows="3"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                      />
                    </div>

                    {/* Domain-Specific Knowledge File Upload */}
                    <div className="form-group">
                      <label className="form-label">
                        <span className="kb-icon">🗂</span> Domain-Specific Knowledge (Accepted: .csv, .json, .pdf, .xlsx, .txt, .docx)
                      </label>

                      <div
                        className={`drag-drop-zone ${isDragging ? 'dragging' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('domain-file-input').click()}
                      >
                        <div className="upload-icon-box">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#687078" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        </div>
                        <div className="upload-main-text">Click to browse or drag & drop multiple files</div>
                        <div className="upload-sub-text">
                          Support(s): .txt, .pdf, .docx, .xls, .xlsx, .csv, .ppt, .pptx, .xml, .jpg, .jpeg, .png (Max 5MB per file)
                        </div>
                      </div>

                      <div className="upload-footer-hint">
                        This document provides additional context for agents operating in this domain.
                      </div>

                      <input
                        type="file"
                        id="domain-file-input"
                        style={{ display: 'none' }}
                        multiple
                        accept=".txt,.pdf,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.xml,.jpg,.jpeg,.png,.json"
                        onChange={handleFileChange}
                      />

                      <div className="uploaded-files-bar">
                        <span className="uploaded-label">Uploaded Files</span>
                        {files.length === 0 ? (
                          <span className="no-file-text">No file chosen</span>
                        ) : (
                          <div className="files-pill-list">
                            {files.map((file, idx) => (
                              <span key={idx} className="file-pill">
                                📄 {file.name}
                                <button
                                  type="button"
                                  className="file-remove-btn"
                                  onClick={() => removeFile(idx)}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="form-actions-row">
                      <button type="submit" className="btn-save-domain">
                        Save Domain
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Section 2: Existing Domains Card */}
            <div className="custom-accordion-card">
              <div
                className="accordion-header"
                onClick={() => setExistingCollapsed(!existingCollapsed)}
              >
                <span className="accordion-title">Existing Domains</span>
                <span className={`accordion-arrow ${existingCollapsed ? 'collapsed' : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </span>
              </div>

              {!existingCollapsed && (
                <div className="accordion-body">
                  <div className="existing-domains-list">
                    {domains.map((domain) => (
                      <div key={domain.id} className="existing-domain-card">
                        <div className="domain-info-left">
                          {/* Domain Title and Status Badge */}
                          <div className="domain-title-badge-row">
                            <span
                              className="domain-name-link"
                              onClick={() => onSelectDomain(domain)}
                            >
                              {domain.title}
                            </span>
                            <span className="inactive-badge">Inactive</span>
                          </div>

                          {/* Domain Description */}
                          <p className="domain-desc-text">{domain.description}</p>

                          {/* Workflow Stats Pills */}
                          <div className="workflow-stats-pills">
                            <span className="stat-pill pill-completed">
                              ✓ {domain.stats?.completed || 0} Completed
                            </span>
                            <span className="stat-pill pill-running">
                              ⚡ {domain.stats?.running || 0} Running
                            </span>
                            <span className="stat-pill pill-pending">
                              ⏱ {domain.stats?.pending || 0} Pending
                            </span>
                          </div>
                        </div>

                        {/* Domain Actions Right */}
                        <div className="domain-actions-right">
                          <button
                            type="button"
                            className="btn-edit-domain"
                            title="Edit Domain"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            className="btn-view-workflows"
                            onClick={() => onSelectDomain(domain)}
                            title="View workflows in this domain"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0073bb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            <span className="view-count-number">{domain.workflowCount || 0}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SpaceBetween>
        </div>
      }
      toolsHide={true}
    />
  )
}

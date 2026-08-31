import React, { useState } from 'react'

export function normalizeSharePointItem(rawItem) {
  const title = rawItem.Title || rawItem.title || rawItem.name || 'Untitled Starter Pack'
  const id = rawItem.Id ? String(rawItem.Id) : (rawItem.id || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
  const industryName = rawItem.Industry || rawItem.industry || rawItem.BusinessLine || rawItem['Business Line'] || rawItem.Category || 'General / Other'
  const industryId = industryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  const description = rawItem.Description || rawItem.description || rawItem.SolutionSummary || rawItem['Solution Summary'] || rawItem['Brief description'] || ''
  const tagline = rawItem.Tagline || rawItem.tagline || (description ? description.slice(0, 80) + '...' : '')
  const problemSolved = rawItem['Problem Solved'] || rawItem.ProblemSolved || rawItem.problemSolved || ''
  const solutionDescription = rawItem['Long Description'] || rawItem.SolutionDescription || rawItem.solutionDescription || description

  // Parse Agents Involved pipeline
  let agentPipeline = []
  const rawAgents = rawItem['Agents Involved'] || rawItem.AgentsInvolved || rawItem.agentPipeline || rawItem['High level workflow']
  if (Array.isArray(rawAgents)) {
    agentPipeline = rawAgents.map((a) => typeof a === 'string' ? { name: a, role: 'Autonomous Multi-Agent Step' } : a)
  } else if (typeof rawAgents === 'string' && rawAgents.trim()) {
    const lines = rawAgents.replace(/<[^>]+>/g, '').split(/\r?\n|>|;/).map((s) => s.trim()).filter(Boolean)
    agentPipeline = lines.map((ln) => {
      const match = ln.match(/^([^\[]+)\s*\[([\s\S]*)\]$/)
      if (match) {
        return { name: match[1].trim(), role: match[2].trim() }
      }
      return { name: ln, role: 'Autonomous Multi-Agent Step' }
    })
  }

  if (agentPipeline.length === 0) {
    agentPipeline = [
      { name: 'Intelligent Ingestion Agent', role: 'Parses incoming task inputs' },
      { name: 'Core Processing Agent', role: 'Applies domain intelligence models' },
      { name: 'Validation & Sign-Off Agent', role: 'Certifies output quality and compliance' },
    ]
  }

  // Parse Availability / Hyperscalers
  let availability = []
  const rawAvail = rawItem.Availability || rawItem.availability || rawItem['Supported hyperscalers'] || rawItem.Platforms
  if (Array.isArray(rawAvail)) {
    availability = rawAvail.map(String)
  } else if (typeof rawAvail === 'string' && rawAvail.trim()) {
    availability = rawAvail.split(/\r?\n|,|;/).map((s) => s.trim()).filter(Boolean)
  }
  if (availability.length === 0) {
    availability = ['Amplifier for Agentic Experience', 'AWS Bedrock', 'Amplifier for Foundations']
  }

  // Parse ROI Metrics
  const rawRoi = rawItem['Expected ROI Metrics'] || rawItem.ExpectedRoiMetrics || rawItem.roiMetrics || rawItem.Impact
  let roiMetrics = {
    timeSavings: '~60%',
    timeLabel: 'time-to-approval',
    costSavings: '~35%',
    costLabel: 'cost',
    summary: 'Accelerates turnaround and cuts operational overhead.',
  }
  if (typeof rawRoi === 'object' && rawRoi !== null) {
    roiMetrics = { ...roiMetrics, ...rawRoi }
  } else if (typeof rawRoi === 'string') {
    const matches = rawRoi.match(/(\d+%\s*[^,\n;]+)/g)
    if (matches && matches.length >= 2) {
      roiMetrics.timeSavings = matches[0].split(' ')[0]
      roiMetrics.timeLabel = matches[0].replace(roiMetrics.timeSavings, '').trim()
      roiMetrics.costSavings = matches[1].split(' ')[0]
      roiMetrics.costLabel = matches[1].replace(roiMetrics.costSavings, '').trim()
    }
  }

  const score = Number(rawItem['Rating (0-5)'] || rawItem.Rating || rawItem.rating || 5)
  const count = Number(rawItem['Number of Ratings'] || rawItem.NumberOfRatings || rawItem.ratingCount || 10)

  const quickLinks = [
    {
      id: 'demo',
      label: 'Click Through Demo',
      icon: 'video',
      url: rawItem['Click Through Demo'] || rawItem.demoUrl || 'https://sogeti.navattic.com/flowofagenticsystem?g=cmgg9vmwh000004lccfo0cg8o&s=0',
    },
    {
      id: 'deck',
      label: 'Pitch Deck',
      icon: 'deck',
      url: rawItem['Pitch Deck'] || rawItem.deckUrl || 'https://capgemini.sharepoint.com/sites/KnowNow/_layouts/15/viewer.aspx?sourcedoc={e4cede9f-c8e8-403d-b63f-0f7a14e3ce85}',
    },
    {
      id: 'setup',
      label: 'Workflow Setup Instructions',
      icon: 'workflow',
      url: rawItem['Workflow Setup Instructions'] || rawItem.setupUrl || 'https://capgemini.sharepoint.com/sites/KnowNow/AIMarketplace/SitePages/Workflow-Instructions.aspx',
    },
    {
      id: 'sample',
      label: 'Sample Input File',
      icon: 'file',
      url: rawItem['Sample Input File'] || rawItem.sampleUrl || 'https://capgemini.sharepoint.com/sites/KnowNow/AIMarketplace/SiteAssets/Sample_Loan_Application_Data.csv',
    },
  ]

  const agenticLinkUrl = rawItem['Agentic link'] || rawItem.agenticLinkUrl || 'https://agenticexperience.azurewebsites.net/login'

  return {
    id,
    title,
    tagline,
    description,
    industry: industryName,
    category: rawItem.Category || industryName.split(' ')[0],
    benefits: rawItem.Benefits || rawItem.benefits || 'Accelerates idea-to-production with automated compliance.',
    demoAvailable: true,
    agenticLinkUrl,
    videoUrl: rawItem.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: rawItem.duration || '1:45',
    problemSolved,
    solutionDescription,
    agentPipeline,
    availability,
    roiMetrics,
    ratings: { score: isNaN(score) ? 5 : score, maxScore: 5, count: isNaN(count) ? 10 : count },
    quickLinks,
    comments: [],
  }
}

export default function SharePointImporterModal({ isOpen, onClose, onImportItems }) {
  const [jsonInput, setJsonInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  if (!isOpen) return null

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target.result
        setJsonInput(text)
        setErrorMsg('')
      } catch (err) {
        setErrorMsg('Failed to read file: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  const handleProcessImport = () => {
    setErrorMsg('')
    setSuccessMsg('')
    if (!jsonInput.trim()) {
      setErrorMsg('Please paste JSON data or upload a file first.')
      return
    }

    try {
      let rawData = JSON.parse(jsonInput)
      if (!Array.isArray(rawData)) {
        if (rawData.value && Array.isArray(rawData.value)) {
          rawData = rawData.value
        } else if (rawData.d && Array.isArray(rawData.d.results)) {
          rawData = rawData.d.results
        } else {
          rawData = [rawData]
        }
      }

      const normalizedPacks = rawData.map(normalizeSharePointItem)
      onImportItems(normalizedPacks)
      setSuccessMsg(`Successfully synchronized ${normalizedPacks.length} starter pack(s)!`)
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err) {
      setErrorMsg('JSON parsing error: ' + err.message + '. Please ensure a valid JSON array or SharePoint export.')
    }
  }

  return (
    <div className="starter-pack-modal-backdrop" onClick={onClose}>
      <div
        className="starter-pack-modal-dialog"
        style={{ maxWidth: 720 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="modal-close-red-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ✕
        </button>

        <div className="modal-header-section">
          <div className="modal-header-text">
            <h1 className="modal-main-title">Sync SharePoint List Items</h1>
            <p className="modal-subtitle-tagline">
              Paste JSON or upload your exported "Industrialized Use cases" list data to update all starter packs in real-time.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              border: '2px dashed #2a3764',
              borderRadius: 8,
              padding: '16px 20px',
              backgroundColor: '#121a38',
              textAlign: 'center',
            }}
          >
            <input
              type="file"
              accept=".json,.txt"
              id="sp-file-input"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <label
              htmlFor="sp-file-input"
              style={{
                cursor: 'pointer',
                color: '#00a3e0',
                fontWeight: 600,
                fontSize: 14,
                display: 'inline-block',
              }}
            >
              📁 Click to Upload SharePoint Export JSON File
            </label>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
              Or Paste SharePoint List JSON Array:
            </label>
            <textarea
              rows={7}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='[ { "Title": "Smart Loan Origination", "Industry": "Banking and Financial Services (BFSI)", "Problem Solved": "...", ... } ]'
              style={{
                width: '100%',
                backgroundColor: '#121a38',
                color: '#ffffff',
                border: '1px solid #2a3764',
                borderRadius: 6,
                padding: '10px 12px',
                fontFamily: 'monospace',
                fontSize: 12,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {errorMsg && (
            <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 10, borderRadius: 6, fontSize: 13 }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 10, borderRadius: 6, fontSize: 13 }}>
              ✅ {successMsg}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #2a3764',
                color: '#94a3b8',
                borderRadius: 6,
                padding: '8px 16px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProcessImport}
              className="btn-agentic-link"
              style={{ padding: '8px 20px' }}
            >
              Sync Starter Packs
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

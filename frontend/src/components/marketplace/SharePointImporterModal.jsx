import React, { useState } from 'react'

export function normalizeStarterPack(rawItem) {
  const title = rawItem.Title || rawItem.title || rawItem.name || rawItem.Agent_x0020_Name || 'Untitled Starter Pack'
  const id = rawItem.Id ? String(rawItem.Id) : (rawItem.id || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
  const industryName = rawItem.Industry || rawItem.industry || rawItem.BusinessLine || rawItem['Business Line'] || rawItem.Category || 'General / Other'

  const description = rawItem.Description || rawItem.description || rawItem.SolutionSummary || rawItem['Solution Summary'] || rawItem.Solution_x0020_Summary || rawItem['Brief description'] || ''
  const tagline = rawItem.Tagline || rawItem.tagline || (description ? description.slice(0, 80) + '...' : '')
  const problemSolved = rawItem['Problem Solved'] || rawItem.Problem_x0020_Solved || rawItem.ProblemSolved || rawItem.problemSolved || ''
  const solutionDescription = rawItem['Long Description'] || rawItem.SolutionDescription || rawItem.solutionDescription || description

  // Parse Agents Involved pipeline
  let agentPipeline = []
  const rawAgents = rawItem['Agents Involved'] || rawItem.Agents_x0020_Involved || rawItem.AgentsInvolved || rawItem.agentPipeline || rawItem['High level workflow']
  if (Array.isArray(rawAgents)) {
    agentPipeline = rawAgents.map((a) => (typeof a === 'string' ? { name: a, role: 'Autonomous Multi-Agent Step' } : a))
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
      {"name": "Intelligent Ingestion Agent", "role": "Parses incoming task inputs"},
      {"name": "Core Processing Agent", "role": "Applies domain intelligence models"},
      {"name": "Validation & Sign-Off Agent", "role": "Certifies output quality and compliance"},
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
    availability = ['Amplifier for Agentic Experience', 'AWS Bedrock Agentic Core', 'Amplifier for Foundations']
  }

  // Parse ROI Metrics
  const rawRoi = rawItem['Expected ROI Metrics'] || rawItem.Expected_x0020_ROI_x0020_Metrics || rawItem.ExpectedRoiMetrics || rawItem.roiMetrics || rawItem.Impact
  let roiMetrics = {
    timeSavings: '~60%',
    timeLabel: 'time-to-approval',
    costSavings: '~35%',
    costLabel: 'cost reduction',
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

  const score = Number(rawItem['Rating (0-5)'] || rawItem.Rating_x0020__x0028_0_x002d_5_x0029_ || rawItem.Rating || 5)
  const count = Number(rawItem['Number of Ratings'] || rawItem.Number_x0020_of_x0020_Ratings || rawItem.ratingCount || 10)

  const quickLinks = [
    {
      id: 'demo',
      label: 'Click Through Demo',
      icon: 'video',
      url: rawItem['Click Through Demo'] || rawItem.Click_x0020_Through_x0020_Demo || rawItem.demoUrl || 'https://sogeti.navattic.com/flowofagenticsystem?g=cmgg9vmwh000004lccfo0cg8o&s=0',
    },
    {
      id: 'deck',
      label: 'Pitch Deck',
      icon: 'deck',
      url: rawItem['Pitch Deck'] || rawItem.Pitch_x0020_Deck || rawItem.deckUrl || 'https://capgemini.sharepoint.com/sites/KnowNow/_layouts/15/viewer.aspx',
    },
    {
      id: 'setup',
      label: 'Workflow Setup Instructions',
      icon: 'workflow',
      url: rawItem['Workflow Setup Instructions'] || rawItem.Workflow_x0020_Setup_x0020_Instructions || rawItem.setupUrl || 'https://capgemini.sharepoint.com/sites/KnowNow/AIMarketplace/SitePages/Workflow-Instructions.aspx',
    },
    {
      id: 'sample',
      label: 'Sample Input File',
      icon: 'file',
      url: rawItem['Sample Input File'] || rawItem.Sample_x0020_Input_x0020_File || rawItem.sampleUrl || 'https://capgemini.sharepoint.com/sites/KnowNow/AIMarketplace/SiteAssets/Sample_Loan_Application_Data.csv',
    },
  ]

  return {
    id,
    title,
    tagline,
    description,
    industry: industryName,
    category: rawItem.Category || industryName.split(' ')[0],
    benefits: rawItem.Benefits || rawItem.benefits || 'Accelerates idea-to-production with automated compliance.',
    demoAvailable: true,
    agenticLinkUrl: rawItem['Agentic link'] || rawItem.Agentic_x0020_Link || rawItem.agenticLinkUrl || 'https://agenticexperience.azurewebsites.net/login',
    videoUrl: rawItem.videoUrl || rawItem.Demo_x0020_Video || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
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

export function normalizeAgent(rawItem) {
  const title = rawItem.Title || rawItem.title || rawItem.name || rawItem.Agent_x0020_Name || 'Untitled Enterprise Agent'
  const id = rawItem.Id ? String(rawItem.Id) : (rawItem.id || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
  const domainName = rawItem.Domain || rawItem.domain || rawItem.Industry || 'Consultancy'

  let capabilities = []
  const rawCaps = rawItem.Capabilities || rawItem.capabilities || rawItem['Core Capabilities']
  if (Array.isArray(rawCaps)) {
    capabilities = rawCaps.map(String)
  } else if (typeof rawCaps === 'string' && rawCaps.trim()) {
    capabilities = rawCaps.split(/\r?\n|,|;/).map((s) => s.trim()).filter(Boolean)
  }
  if (capabilities.length === 0) {
    capabilities = ['Autonomous Task Execution', 'Contextual Reasoning', 'Enterprise System Integration']
  }

  const score = Number(rawItem['Rating (0-5)'] || rawItem.Rating_x0020__x0028_0_x002d_5_x0029_ || rawItem.Rating || 4.8)
  const count = Number(rawItem['Number of Ratings'] || rawItem.Number_x0020_of_x0020_Ratings || rawItem.ratingCount || 12)

  return {
    id,
    title,
    domain: domainName,
    category: domainName,
    description: rawItem.Description || rawItem.description || rawItem['Brief description'] || '',
    benefits: rawItem.Benefits || rawItem.benefits || rawItem.Key_x0020_Benefits || 'Empowers teams with autonomous decision making and rapid task execution.',
    capabilities,
    demoAvailable: true,
    ratings: { score: isNaN(score) ? 4.8 : score, count: isNaN(count) ? 12 : count },
    availability: rawItem.Availability || ['Amplifier for Agentic Experience', 'AWS Bedrock Agentic Core'],
    comments: [],
  }
}

export default function SharePointImporterModal({ isOpen, onClose, onImportItems }) {
  const [listType, setListType] = useState('starterPacks')
  const [jsonInput, setJsonInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleProcessImport = async () => {
    setErrorMsg('')
    setSuccessMsg('')
    if (!jsonInput.trim()) {
      setErrorMsg('Please paste JSON data or upload a file first.')
      return
    }

    try {
      setIsSubmitting(true)
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

      const isAgentsList = listType === 'agents' || rawData.some((item) => item.domain || item.Domain || item.capabilities || item.Capabilities)
      const normalizedItems = isAgentsList ? rawData.map(normalizeAgent) : rawData.map(normalizeStarterPack)
      const targetType = isAgentsList ? 'agents' : 'starterPacks'

      if (onImportItems) {
        await onImportItems(rawData, normalizedItems, targetType)
      }

      setSuccessMsg(`Successfully synchronized ${normalizedItems.length} item(s) to AWS S3 & local catalog!`)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      setErrorMsg('JSON parsing error: ' + err.message + '. Please ensure a valid JSON array or SharePoint export.')
    } finally {
      setIsSubmitting(false)
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
            <h1 className="modal-main-title">Sync SharePoint List to AWS S3</h1>
            <p className="modal-subtitle-tagline">
              Paste JSON or upload your exported SharePoint list data. Data is processed through the AWS Lambda connector and synced directly to S3.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Target SharePoint List:</span>
            <button
              type="button"
              className={`btn-toolbar-blue ${listType === 'starterPacks' ? 'active' : ''}`}
              style={{
                backgroundColor: listType === 'starterPacks' ? '#0073bb' : '#1e293b',
                color: '#fff',
                fontSize: 12,
                padding: '6px 12px',
                borderRadius: 4,
                border: '1px solid #334155',
                cursor: 'pointer',
              }}
              onClick={() => setListType('starterPacks')}
            >
              Industrialized Use Cases (Starter Packs)
            </button>
            <button
              type="button"
              className={`btn-toolbar-blue ${listType === 'agents' ? 'active' : ''}`}
              style={{
                backgroundColor: listType === 'agents' ? '#0073bb' : '#1e293b',
                color: '#fff',
                fontSize: 12,
                padding: '6px 12px',
                borderRadius: 4,
                border: '1px solid #334155',
                cursor: 'pointer',
              }}
              onClick={() => setListType('agents')}
            >
              Operational Excellence Agents
            </button>
          </div>

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
              rows={6}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='[ { "Title": "Smart Loan Origination", "Industry": "Banking & Financial Services (BFSI)", ... } ]'
              style={{
                width: '100%',
                backgroundColor: '#121a38',
                color: '#f8fafc',
                border: '1px solid #2a3764',
                borderRadius: 6,
                padding: 10,
                fontFamily: 'monospace',
                fontSize: 12,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {errorMsg && (
            <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: 4, fontSize: 13 }}>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '8px 12px', borderRadius: 4, fontSize: 13 }}>
              {successMsg}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 4,
                border: '1px solid #334155',
                backgroundColor: 'transparent',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleProcessImport}
              style={{
                padding: '8px 18px',
                borderRadius: 4,
                border: 'none',
                backgroundColor: '#0073bb',
                color: '#fff',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Syncing to S3...' : '⚡ Trigger ETL & Sync S3'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

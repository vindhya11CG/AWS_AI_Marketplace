import React, { useState } from 'react'
import {
  AppLayout,
  Box,
  Button,
  Container,
  Header,
  SpaceBetween,
  Flashbar,
} from '@cloudscape-design/components'
import Sidebar from './Sidebar'
import '../styles/WorkflowBuilder.css'

const availableAgents = [
  { id: 'data-extractor', name: 'Data Extractor Agent', desc: 'Parses and extracts structured entities from incoming documents.' },
  { id: 'spec-analyzer', name: 'Requirement & Spec Analyzer', desc: 'Evaluates business criteria and rules against extracted data.' },
  { id: 'llm-reasoner', name: 'Deep Reasoning & Decision Agent', desc: 'Executes complex domain logic and decision-tree evaluation.' },
  { id: 'risk-checker', name: 'Security & Risk Mitigation Agent', desc: 'Screens operations for regulatory compliance and fraud vectors.' },
  { id: 'reporter', name: 'Summary & Report Generator Agent', desc: 'Compiles execution audit trails and stakeholder notifications.' },
]

export default function WorkflowBuilder({
  domains = [],
  initialDomain = null,
  onAddWorkflow,
  onNavigate,
  activeHref = '#/workflows',
}) {
  const [workflowName, setWorkflowName] = useState('')
  const [selectedDomainId, setSelectedDomainId] = useState(initialDomain?.id || domains[0]?.id || '')
  const [description, setDescription] = useState('')
  const [selectedAgents, setSelectedAgents] = useState(['data-extractor', 'spec-analyzer'])
  const [triggerType, setTriggerType] = useState('Event-Driven (AWS EventBridge)')
  const [flashMessages, setFlashMessages] = useState([])

  const toggleAgent = (agentId) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!workflowName.trim()) {
      setFlashMessages([
        {
          type: 'error',
          content: 'Please provide a workflow name.',
          dismissible: true,
          id: 'err-wfname',
          onDismiss: () => setFlashMessages([]),
        },
      ])
      return
    }

    const domainObj = domains.find((d) => d.id === selectedDomainId) || domains[0]
    const agentNames = selectedAgents.map(
      (id) => availableAgents.find((a) => a.id === id)?.name || id
    )

    const newWf = {
      id: Date.now(),
      name: workflowName.trim(),
      domain: domainObj ? domainObj.title : 'General',
      domainId: domainObj ? domainObj.id : 'general',
      lastModified: new Date().toLocaleDateString(),
      status: 'Pending',
      agents: agentNames,
      description: description.trim() || 'Custom multi-agent automated workflow.',
      triggerType,
    }

    onAddWorkflow(newWf)

    setFlashMessages([
      {
        type: 'success',
        content: `Workflow "${newWf.name}" created and deployed successfully!`,
        dismissible: true,
        id: 'succ-wf',
        onDismiss: () => setFlashMessages([]),
      },
    ])

    setTimeout(() => {
      onNavigate('#/dashboard')
    }, 1200)
  }

  return (
    <AppLayout
      navigation={<Sidebar activeHref={activeHref} onNavigate={onNavigate} />}
      content={
        <div className="workflow-builder-page">
          {flashMessages.length > 0 && (
            <div className="flashbar-wrapper">
              <Flashbar items={flashMessages} />
            </div>
          )}

          {/* Top Bar */}
          <div className="builder-top-bar">
            <button
              type="button"
              className="back-btn"
              onClick={() => onNavigate('#/dashboard')}
            >
              ← Back to Dashboard
            </button>
          </div>

          <div className="builder-header">
            <h1 className="builder-title">Workflow Builder</h1>
            <p className="builder-subtitle">
              Design, connect agents, and orchestrate automated multi-agent pipelines.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <SpaceBetween size="l" direction="vertical">
              {/* Step 1: Basic Information */}
              <Container
                header={
                  <Header variant="h2">
                    1. Workflow Details
                  </Header>
                }
              >
                <div className="builder-form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Workflow Name <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Medical Claim Pre-Authorization Pipeline"
                      value={workflowName}
                      onChange={(e) => setWorkflowName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Associated Domain <span className="required-star">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedDomainId}
                      onChange={(e) => setSelectedDomainId(e.target.value)}
                    >
                      {domains.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Workflow Purpose & Instructions</label>
                    <textarea
                      className="form-textarea"
                      rows="2"
                      placeholder="Describe what tasks this workflow accomplishes and expected input triggers..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
              </Container>

              {/* Step 2: Agent Pipeline Orchestration */}
              <Container
                header={
                  <Header
                    variant="h2"
                    description="Select which specialized agents participate in this execution pipeline."
                  >
                    2. Multi-Agent Pipeline Assembly
                  </Header>
                }
              >
                <div className="agent-selection-grid">
                  {availableAgents.map((agent) => {
                    const isSelected = selectedAgents.includes(agent.id)
                    return (
                      <div
                        key={agent.id}
                        className={`agent-card-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleAgent(agent.id)}
                      >
                        <div className="agent-card-header">
                          <span className="agent-icon">🤖</span>
                          <span className="agent-name">{agent.name}</span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="agent-checkbox"
                          />
                        </div>
                        <p className="agent-desc">{agent.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </Container>

              {/* Step 3: Trigger & Actions */}
              <Container
                header={
                  <Header variant="h2">
                    3. Trigger & Deployment Settings
                  </Header>
                }
              >
                <div className="form-group">
                  <label className="form-label">Trigger Mechanism</label>
                  <select
                    className="form-select"
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value)}
                  >
                    <option value="Event-Driven (AWS EventBridge)">
                      ⚡ Event-Driven (AWS EventBridge / SQS)
                    </option>
                    <option value="REST API Webhook">
                      🌐 REST API Webhook Endpoint
                    </option>
                    <option value="Scheduled Cron">
                      ⏱ Scheduled Periodic Run
                    </option>
                    <option value="Manual Dispatch">
                      🖱 Manual On-Demand Dispatch
                    </option>
                  </select>
                </div>

                <div className="builder-actions-footer">
                  <Button
                    variant="normal"
                    type="button"
                    onClick={() => onNavigate('#/dashboard')}
                  >
                    Cancel
                  </Button>
                  <button type="submit" className="btn-deploy-workflow">
                    Deploy Workflow
                  </button>
                </div>
              </Container>
            </SpaceBetween>
          </form>
        </div>
      }
      toolsHide={true}
    />
  )
}

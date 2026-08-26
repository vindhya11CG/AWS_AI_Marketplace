/**
 * Marketplace data model.
 *
 * Each starter pack follows the shape:
 * {
 *   id: string,
 *   title: string,
 *   description: string,
 *   benefits: string,
 *   category: string,
 *   demoAvailable: boolean
 * }
 *
 * Industries group related starter packs for the industry catalog.
 */

/**
 * @typedef {Object} StarterPack
 * @property {string} id - Unique identifier for the starter pack.
 * @property {string} title - Display name of the starter pack.
 * @property {string} description - Short summary of what the pack does.
 * @property {string} benefits - Key business benefits, comma separated.
 * @property {string} category - Business category the pack belongs to.
 * @property {boolean} demoAvailable - Whether a live demo is available.
 */

/**
 * @typedef {Object} Industry
 * @property {string} id - Unique identifier for the industry.
 * @property {string} name - Display name of the industry.
 * @property {StarterPack[]} starterPacks - Starter packs within the industry.
 */

/** @type {Industry[]} */
export const INDUSTRIES = [
  {
    id: 'bfsi',
    name: 'Banking and Financial Services (BFSI)',
    starterPacks: [
      {
        id: 'bfsi-smart-loan-origination',
        title: 'Smart Loan Origination',
        description: 'Automates verification, risk assessment, and KYC.',
        benefits: 'Faster approvals, reduced risk, automated KYC',
        category: 'Banking',
        demoAvailable: true,
      },
      {
        id: 'bfsi-intelligent-fraud-detector',
        title: 'Intelligent Fraud Detector',
        description:
          'Reduces undetected fraud, minimizes human effort, and adapts to evolving schemes through automated detection and compliance enforcement.',
        benefits: 'Fewer missed frauds, less manual effort, adaptive detection',
        category: 'Banking',
        demoAvailable: true,
      },
      {
        id: 'bfsi-intelligent-underwriter',
        title: 'Intelligent Underwriter (Insurance) Advisor',
        description:
          'Automates policy customization and premium calculation, speeds up insurance decision-making, and improves accuracy and consistency across underwriting.',
        benefits: 'Faster decisions, consistent pricing, higher accuracy',
        category: 'Insurance',
        demoAvailable: false,
      },
    ],
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    starterPacks: [
      {
        id: 'healthcare-clinical-documentation',
        title: 'Clinical Documentation Assistants',
        description: 'Automates intake, symptom analysis, and smart routing to doctors.',
        benefits: 'Faster intake, accurate routing, less admin',
        category: 'Healthcare',
        demoAvailable: true,
      },
      {
        id: 'healthcare-prior-authorization',
        title: 'Prior Authorization in Healthcare Insurance',
        description:
          'Automates eligibility checks, diagnosis validation, coverage-limit retrieval, and decision generation using a RAG-enabled knowledge base, with clear explanations and audit logs.',
        benefits: 'Automated eligibility, auditable decisions, faster approvals',
        category: 'Healthcare',
        demoAvailable: false,
      },
      {
        id: 'healthcare-pii-redaction',
        title: 'PII Redaction Agent',
        description:
          'Applies version-controlled, deterministic redaction rules with optional human review, producing sanitized outputs and complete audit trails suitable for GDPR and health-data compliance.',
        benefits: 'GDPR-ready redaction, audit trails, reduced compliance risk',
        category: 'Healthcare',
        demoAvailable: false,
      },
    ],
  },
  {
    id: 'horizontal',
    name: 'Horizontal',
    starterPacks: [
      {
        id: 'horizontal-autonomous-procurement',
        title: 'Autonomous Procurement Agent',
        description:
          'Transforms procurement from reactive to proactive, captures opportunities efficiently using AI, and minimizes coordination overhead.',
        benefits: 'Proactive sourcing, captured savings, less overhead',
        category: 'Cross-Industry',
        demoAvailable: true,
      },
      {
        id: 'horizontal-smart-talent-advisor',
        title: 'Smart Talent Advisor',
        description:
          'Minimizes bench time through AI-driven skill-to-role matching, boosts confidence via realistic interview simulations using AI avatars, and accelerates deployment while improving engagement.',
        benefits: 'Less bench time, faster deployment, better matching',
        category: 'Cross-Industry',
        demoAvailable: false,
      },
      {
        id: 'horizontal-contract-legal-analyzer',
        title: 'Contract Legal Analyzer & Advisor',
        description:
          'Delivers scalable legal support by automating document analysis and legal research, providing actionable recommendations, and using specialized AI agents trained on legal reasoning.',
        benefits: 'Scalable legal review, faster research, actionable advice',
        category: 'Cross-Industry',
        demoAvailable: false,
      },
    ],
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    starterPacks: [
      {
        id: 'manufacturing-predictive-maintenance',
        title: 'Predictive Maintenance',
        description:
          'AI-driven predictive maintenance minimizes downtime, lowers repair costs, and improves operational efficiency by preventing failures before they happen.',
        benefits: 'Less downtime, lower repair cost, higher efficiency',
        category: 'Manufacturing',
        demoAvailable: true,
      },
      {
        id: 'manufacturing-quality-inspection',
        title: 'Quality Inspection Agents',
        description:
          'AI-powered inspection eliminates subjectivity, accelerates defect detection, and streamlines compliance, reducing costs and improving customer satisfaction.',
        benefits: 'Faster defect detection, objective QC, lower cost',
        category: 'Manufacturing',
        demoAvailable: false,
      },
      {
        id: 'manufacturing-design-document-qc',
        title: 'Design Document Quality Check',
        description:
          'Automates document validation, detects inconsistencies, accelerates timelines, improves audit readiness, and reduces errors.',
        benefits: 'Fewer errors, faster timelines, audit-ready',
        category: 'Manufacturing',
        demoAvailable: false,
      },
      {
        id: 'manufacturing-sopla',
        title: 'Self-Optimizing Production Line Agents (SOPLA)',
        description:
          'Adjusts throughput, energy, and process parameters, enforces safety and compliance, and drives continuous improvements through anomaly detection and actionable insights.',
        benefits: 'Optimized throughput, energy savings, continuous improvement',
        category: 'Manufacturing',
        demoAvailable: false,
      },
    ],
  },
  {
    id: 'public-sector',
    name: 'Public Sector',
    starterPacks: [
      {
        id: 'public-smart-municipal-complaint',
        title: 'Smart Municipal Complaint Agent',
        description:
          'Auto-classifies photo complaints, detects duplicates, sets priority/SLA, and routes tasks to the right team.',
        benefits: 'Auto-classification, SLA routing, duplicate detection',
        category: 'Public Sector',
        demoAvailable: true,
      },
      {
        id: 'public-citizen-data-access',
        title: 'Citizen Data Access Compliance Solution',
        description:
          'Automates DSAR intake tracking, workflow orchestration, evidence collection, redaction support, compliance checks, and audit-ready packaging with human approvals at key stages.',
        benefits: 'Automated DSAR, audit-ready, faster compliance',
        category: 'Public Sector',
        demoAvailable: false,
      },
      {
        id: 'public-intelligent-tender-review',
        title: 'Intelligent Tender Review Assistant',
        description:
          'Applies deterministic rule packs to validate mandatory requirements, signatures, declarations, certificates, and integrity checks, producing clear eligibility outcomes with evidence-linked explanations and controlled human review for ambiguous cases.',
        benefits: 'Rule-based validation, clear eligibility, less manual review',
        category: 'Public Sector',
        demoAvailable: false,
      },
      {
        id: 'public-action-logement-intake',
        title: 'Action Logement Intake & Eligibility Agent',
        description:
          'Automates data capture, document quality checks, eligibility validation, and duplicate detection at the point of intake, creating complete, compliant, and traceable dossiers ready for downstream processing.',
        benefits: 'Clean dossiers, validated eligibility, full traceability',
        category: 'Public Sector',
        demoAvailable: false,
      },
      {
        id: 'public-tender-comparison',
        title: 'Tender Comparison Agent',
        description:
          'Parses and normalizes all tender documents, runs deterministic rule checks and scoring uniformly across bidders, and outputs an evidence-backed compliance matrix + final report with complete auditability.',
        benefits: 'Uniform scoring, evidence-backed, full auditability',
        category: 'Public Sector',
        demoAvailable: false,
      },
    ],
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    starterPacks: [
      {
        id: 'realestate-property-listing',
        title: 'Property Listing Agent',
        description:
          'Automates structured property data capture, validates mandatory fields and documents, enforces workflow guardrails, and creates marketing-ready listings directly in CRM/ERP systems.',
        benefits: 'Validated data, faster listings, CRM-ready',
        category: 'Real Estate',
        demoAvailable: true,
      },
      {
        id: 'realestate-construction-underwriting',
        title: 'Construction Underwriting Agent',
        description:
          'Automates document validation, hazard analysis, risk scoring, and policy-premium calculations using multi-agent orchestration, delivering structured underwriting summaries with clear decision rationale and auditability.',
        benefits: 'Automated risk scoring, clear rationale, auditability',
        category: 'Real Estate',
        demoAvailable: false,
      },
    ],
  },
  {
    id: 'retail',
    name: 'Retail',
    starterPacks: [
      {
        id: 'retail-fashion-retrieval',
        title: 'Fashion Retrieval Agent',
        description:
          'Fuses image similarity + semantic style prompts to retrieve and rank catalog items that match both appearance and aesthetic intent, enabling "shop-the-look" and inspiration-driven discovery without relying on manual tagging.',
        benefits: 'Shop-the-look discovery, no manual tagging, better relevance',
        category: 'Retail',
        demoAvailable: true,
      },
      {
        id: 'retail-in-store-return',
        title: 'In Store Return Authorization',
        description:
          'Automates policy eligibility checks, fraud screening, refund calculation, authorization decisions, and POS/ERP updates, while keeping staff and managers in the loop for physical inspection and exceptions.',
        benefits: 'Faster returns, fraud screening, POS integration',
        category: 'Retail',
        demoAvailable: false,
      },
      {
        id: 'retail-import-export-compliance',
        title: 'Import Export Compliance Agent',
        description:
          'Continuously validates shipment data and documents against jurisdictional rules, coordinates submissions and revalidations, manages exceptions, and synchronizes customs outcomes with logistics and finance systems.',
        benefits: 'Continuous validation, fewer exceptions, synced systems',
        category: 'Retail',
        demoAvailable: false,
      },
      {
        id: 'retail-invoice-processing',
        title: 'Invoice Processing Agent',
        description:
          'Automates invoice ingestion, data extraction, validation, PO/contract matching, and exception handling using AI-driven workflows with secure integrations and full audit logging.',
        benefits: 'Automated processing, accurate matching, full audit logging',
        category: 'Retail',
        demoAvailable: false,
      },
    ],
  },
]

/**
 * Case studies highlighting real-world outcomes.
 * @type {{ id: string, title: string, industry: string, description: string }[]}
 */
export const CASE_STUDIES = [
  {
    id: 'cnhi',
    title: 'CNHI',
    industry: 'Manufacturing',
    description:
      'Streamlined design document quality checks and accelerated engineering timelines with orchestrated AI agents.',
  },
  {
    id: 'innovative-medicine',
    title: 'Innovative Medicine',
    industry: 'Healthcare',
    description:
      'Automated prior authorization and clinical documentation to reduce turnaround time and improve compliance.',
  },
  {
    id: 'disruption-management',
    title: 'Disruption Management',
    industry: 'Cross-Industry',
    description:
      'Proactively identified operational disruptions and coordinated multi-agent responses to minimize downtime.',
  },
]

/**
 * Builds Select options for the industry filter, including an "All" option.
 * @returns {{ label: string, value: string }[]} Industry filter options.
 */
export function buildIndustryFilterOptions() {
  return [
    { label: 'All Industries', value: 'all' },
    ...INDUSTRIES.map((industry) => ({ label: industry.name, value: industry.id })),
  ]
}

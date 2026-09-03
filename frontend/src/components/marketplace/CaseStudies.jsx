import React from 'react'

export default function CaseStudies({ caseStudies }) {
  if (!caseStudies || caseStudies.length === 0) return null

  return (
    <div className="case-studies-section-clean">
      <h2 className="section-main-heading-clean">Case Studies</h2>
      <div className="case-studies-grid-clean">
        {caseStudies.map((study) => (
          <div key={study.id} className="case-study-card-clean">
            <div className="case-study-top">
              <span className="case-study-client-clean">{study.client}</span>
              <h3 className="case-study-usecase-clean">{study.useCase}</h3>
            </div>
            <div className="case-study-tag-wrap">
              <span className="pack-tag-pill-blue">{study.tag}</span>
            </div>
            <p className="case-study-result-clean">{study.result}</p>
            <div className="case-study-action">
              <button type="button" className="btn-read-case-study">
                Read case study →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

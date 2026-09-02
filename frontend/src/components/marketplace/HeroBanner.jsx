import React from 'react'

export default function HeroBanner() {
  return (
    <div
      style={{
        backgroundColor: '#1f2937',
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 0)',
        backgroundSize: '24px 24px',
        borderRadius: 8,
        padding: '36px 40px',
        margin: '12px 0 20px 0',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
      }}
    >
      <div style={{ maxWidth: '65%' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 800,
            margin: '0 0 10px 0',
            color: '#ffffff !important',
            letterSpacing: '-0.02em',
          }}
        >
          <span style={{ color: '#ffffff' }}>Amplifier for Agentic AI - Discovery Portal</span>
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: '#f59e0b',
            fontWeight: 600,
            margin: '0 0 10px 0',
          }}
        >
          Explore, deploy, and launch industry-specific AI Starter Packs for your enterprise.
        </p>
        <p
          style={{
            fontSize: '13.5px',
            color: '#cbd5e1',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Prebuilt multi-agent workflows powered by industry-trained orchestrated models. Accelerate idea-to-production with zero friction.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: 12,
          padding: '20px 24px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <span style={{ fontSize: '42px' }}>⚡</span>
      </div>
    </div>
  )
}

import React from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { motion } from 'motion/react'
import './MarketplaceAuroraHero.css'

function Starfield() {
  return (
    <Canvas
      className="marketplace-aurora-stars"
      camera={{ position: [0, 0, 1], fov: 75 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: false }}
      aria-hidden="true"
    >
      <Stars
        radius={55}
        depth={30}
        count={700}
        factor={3}
        saturation={0}
        fade
        speed={0.35}
      />
    </Canvas>
  )
}

export default function MarketplaceAuroraHero() {
  return (
    <section className="marketplace-aurora-hero" aria-labelledby="marketplace-hero-title">
      <div className="marketplace-aurora-glow marketplace-aurora-glow-one" />
      <div className="marketplace-aurora-glow marketplace-aurora-glow-two" />
      <Starfield />

      <motion.div
        className="marketplace-aurora-content"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <h1 id="marketplace-hero-title">
          Amplifier for Agentic AI - Discovery Portal
        </h1>
        <p className="marketplace-aurora-subtitle">
          Explore, deploy, and launch industry-specific AI Starter Packs for your enterprise.
        </p>
        <p className="marketplace-aurora-description">
          Prebuilt multi-agent workflows powered by industry-trained orchestrated models. Accelerate idea-to-production with zero friction.
        </p>
      </motion.div>
    </section>
  )
}
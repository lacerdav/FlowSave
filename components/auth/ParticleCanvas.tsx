'use client'

import { useEffect, useMemo, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'

export function ParticleCanvas() {
  const [engineReady, setEngineReady] = useState(false)

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setEngineReady(true))
  }, [])

  const options = useMemo(() => ({
    fullScreen: { enable: true, zIndex: 0 },
    fpsLimit: 60,
    background: { color: { value: 'transparent' } },
    interactivity: {
      events: {
        onHover: { enable: true, mode: 'grab' },
        onClick: { enable: true, mode: 'repulse' },
      },
      modes: {
        grab: {
          distance: 180,
          links: { opacity: 0.30, color: '#7c96ff' },
        },
        repulse: {
          distance: 160,
          duration: 0.5,
          speed: 1,
        },
      },
    },
    particles: {
      color: { value: ['#7c96ff', '#5b7fff', '#a8b8ff'] },
      links: {
        color: '#7c96ff',
        distance: 140,
        enable: true,
        opacity: 0.08,
        width: 0.9,
      },
      move: {
        enable: true,
        speed: { min: 0.2, max: 0.7 },
        direction: 'none' as const,
        outModes: { default: 'bounce' as const },
        random: true,
        straight: false,
      },
      number: {
        density: { enable: true, area: 900 },
        value: 110,
      },
      opacity: {
        value: { min: 0.06, max: 0.22 },
        animation: {
          enable: true,
          speed: 0.5,
          sync: false,
        },
      },
      shape: { type: 'circle' },
      size: {
        value: { min: 0.8, max: 2.2 },
      },
    },
    detectRetina: true,
  }), [])

  if (!engineReady) return null

  return (
    <Particles
      id="flowsave-particles"
      options={options}
    />
  )
}

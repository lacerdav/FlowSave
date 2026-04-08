'use client'

import type { ReactNode } from 'react'
import { m, useReducedMotion } from 'framer-motion'

interface DashboardMotionShellProps {
  heroKicker: ReactNode
  heroTitle: ReactNode
  heroDescription: ReactNode
  emptyBanner?: ReactNode
  metricsRow: ReactNode
  middleRow: ReactNode
  lowerRow: ReactNode
}

const ease = [0.22, 1, 0.36, 1] as const

export function DashboardMotionShell({
  heroKicker,
  heroTitle,
  heroDescription,
  emptyBanner,
  metricsRow,
  middleRow,
  lowerRow,
}: DashboardMotionShellProps) {
  const shouldReduceMotion = useReducedMotion()

  const heroTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.34, ease }

  const sectionTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.38, ease }

  const sectionVariants = shouldReduceMotion
    ? {
        hidden: { opacity: 1, y: 0 },
        visible: { opacity: 1, y: 0 },
      }
    : {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
      }

  return (
    <div className="space-y-6 pb-12">
      <div className="dashboard-hero">
        <m.p
          className="page-subtitle page-kicker"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={heroTransition}
        >
          {heroKicker}
        </m.p>
        <m.h1
          className="dashboard-anchor page-title-gradient mt-5"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion ? heroTransition : { ...heroTransition, delay: 0.04 }
          }
        >
          {heroTitle}
        </m.h1>
        <m.p
          className="dashboard-summary"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion ? heroTransition : { ...heroTransition, delay: 0.08 }
          }
        >
          {heroDescription}
        </m.p>
      </div>

      {emptyBanner ? (
        <m.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion ? sectionTransition : { ...sectionTransition, delay: 0.1 }
          }
        >
          {emptyBanner}
        </m.div>
      ) : null}

      <m.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={
          shouldReduceMotion ? sectionTransition : { ...sectionTransition, delay: 0.12 }
        }
      >
        {metricsRow}
      </m.div>

      <m.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={
          shouldReduceMotion ? sectionTransition : { ...sectionTransition, delay: 0.18 }
        }
      >
        {middleRow}
      </m.div>

      <m.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={
          shouldReduceMotion ? sectionTransition : { ...sectionTransition, delay: 0.24 }
        }
      >
        {lowerRow}
      </m.div>
    </div>
  )
}

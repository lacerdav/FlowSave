'use client'

import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion'
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import type { Plan } from '@/types'

const SIDEBAR_STORAGE_KEY = 'flowsave.sidebar-collapsed'
const SIDEBAR_WIDTH_EXPANDED = '224px'
const SIDEBAR_WIDTH_COLLAPSED = '88px'

interface AppShellProps {
  children: React.ReactNode
  email: string
  plan: Plan
}

export function AppShell({ children, email, plan }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored === 'true') {
      setCollapsed(true)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed))
  }, [collapsed, hydrated])

  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation}>
        <div
          className="app-shell"
          data-sidebar-collapsed={collapsed ? 'true' : 'false'}
          style={{
            ['--sidebar-width' as string]: collapsed
              ? SIDEBAR_WIDTH_COLLAPSED
              : SIDEBAR_WIDTH_EXPANDED,
          } as CSSProperties}
        >
          <div aria-hidden className="app-shell__backdrop" />
          <Navbar email={email} plan={plan} />
          <Sidebar collapsed={collapsed} />
          <button
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            className="shell-divider-toggle"
            aria-controls="app-sidebar"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpenIcon className="shell-icon sidebar-toggle-icon" />
            ) : (
              <PanelLeftCloseIcon className="shell-icon sidebar-toggle-icon" />
            )}
          </button>
          <main className="app-main relative z-10 pt-[108px] md:pt-14">
            <div className="mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-6 sm:py-6">
              {children}
            </div>
          </main>
        </div>
      </LazyMotion>
    </MotionConfig>
  )
}

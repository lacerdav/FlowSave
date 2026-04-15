'use client'

import type { CSSProperties } from 'react'
import { useSyncExternalStore } from 'react'
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import type { Plan } from '@/types'

const SIDEBAR_STORAGE_KEY = 'flowsave.sidebar-collapsed'
const SIDEBAR_PREFERENCE_EVENT = 'flowsave:sidebar-preference-change'
const SIDEBAR_WIDTH_EXPANDED = '224px'
const SIDEBAR_WIDTH_COLLAPSED = '88px'

function subscribe(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener(SIDEBAR_PREFERENCE_EVENT, onStoreChange)

  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(SIDEBAR_PREFERENCE_EVENT, onStoreChange)
  }
}

function getSidebarSnapshot() {
  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
}

function getSidebarServerSnapshot() {
  return false
}

interface AppShellProps {
  children: React.ReactNode
  email: string
  plan: Plan
}

export function AppShell({ children, email, plan }: AppShellProps) {
  const collapsed = useSyncExternalStore(
    subscribe,
    getSidebarSnapshot,
    getSidebarServerSnapshot
  )

  function handleToggleSidebar() {
    const nextValue = !collapsed
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue))
    window.dispatchEvent(new Event(SIDEBAR_PREFERENCE_EVENT))
  }

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
            onClick={handleToggleSidebar}
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
          {/* padding-top driven entirely by --navbar-h / --mobile-nav-h in layout.css */}
          <main id="main-content" className="app-main relative z-10">
            <div className="mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-6 sm:py-6">
              {children}
            </div>
          </main>
        </div>
      </LazyMotion>
    </MotionConfig>
  )
}

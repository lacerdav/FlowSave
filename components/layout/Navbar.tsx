'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Plan } from '@/types'

interface NavbarProps {
  email: string
  plan: Plan
}

export function Navbar({ email, plan }: NavbarProps) {
  return (
    <header
      className="app-navbar flex h-14 items-center justify-between px-4 sm:px-6"
    >
      <Link
        href="/dashboard"
        className="brand-link"
        aria-label="FlowSave dashboard"
      >
        <Image
          src="/icon.png"
          alt=""
          width={485}
          height={482}
          className="brand-mark"
          priority
        />
        <span className="brand-name">FlowSave</span>
      </Link>

      <div className="shell-plan-dock" aria-label="Current plan status">
        <span className="plan-badge" data-plan={plan}>
          {plan === 'pro' ? 'PRO ✓' : 'FREE'}
        </span>

        {plan === 'free' ? (
          <Link
            href="/upgrade"
            className="upgrade-link"
          >
            Upgrade to Pro
          </Link>
        ) : (
          <span className="shell-plan-copy">
            Unlimited clients, forecast, and AI
          </span>
        )}
      </div>

      <div className="navbar-actions">
        <span className="navbar-email hidden max-w-[132px] truncate sm:block sm:max-w-[220px]">
          {email}
        </span>
      </div>
    </header>
  )
}

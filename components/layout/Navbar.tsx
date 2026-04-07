'use client'

import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Plan } from '@/types'

interface NavbarProps {
  email: string
  plan: Plan
}

export function Navbar({ email, plan }: NavbarProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

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

      <div className="flex items-center gap-2 sm:gap-3">
        <span
          className="hidden max-w-[132px] truncate text-[11px] sm:block sm:max-w-[220px] sm:text-xs"
          style={{ color: 'var(--text3)' }}
        >
          {email}
        </span>

        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide"
          style={{
            background: plan === 'pro' ? 'var(--accent-dim)' : 'var(--surface)',
            color: plan === 'pro' ? 'var(--accent2)' : 'var(--text3)',
            border: `1px solid ${plan === 'pro' ? 'var(--accent)' : 'var(--border)'}`,
          }}
        >
          {plan}
        </span>

        {plan === 'free' && (
          <Link
            href="/upgrade"
            className="rounded-lg px-3 py-1.5 text-[11px] font-medium transition-opacity hover:opacity-80 sm:text-xs"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Upgrade
          </Link>
        )}

        <button
          onClick={handleSignOut}
          className="text-[11px] transition-colors hover:text-[var(--text)] sm:text-xs"
          style={{ color: 'var(--text3)' }}
        >
          Sign out
        </button>
      </div>
    </header>
  )
}

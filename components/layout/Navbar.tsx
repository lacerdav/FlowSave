'use client'

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
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6"
      style={{
        background: 'rgba(7, 7, 26, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <Link
        href="/dashboard"
        className="text-base font-semibold tracking-tight"
        style={{ color: 'var(--text)' }}
      >
        FlowSave
      </Link>

      <div className="flex items-center gap-3">
        <span className="text-xs" style={{ color: 'var(--text3)' }}>
          {email}
        </span>

        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wide"
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
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Upgrade
          </Link>
        )}

        <button
          onClick={handleSignOut}
          className="text-xs transition-colors hover:text-[var(--text)]"
          style={{ color: 'var(--text3)' }}
        >
          Sign out
        </button>
      </div>
    </header>
  )
}

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const URL_ERROR_MESSAGES: Record<string, string> = {
  missing_code:   'The sign-in link was invalid or already used. Request a new one.',
  auth_failed:    'Sign-in failed. Please try again.',
  access_denied:  'The sign-in link expired or was already used. Request a new one.',
  otp_expired:    'The sign-in link expired. Request a new one.',
}

function resolveUrlError(raw: string | null): string | null {
  if (!raw) return null
  return URL_ERROR_MESSAGES[raw] ?? URL_ERROR_MESSAGES[raw.toLowerCase()] ?? `Sign-in error: ${raw}`
}

interface LoginFormProps {
  urlError?: string | null
}

export function LoginForm({ urlError }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(resolveUrlError(urlError ?? null))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
        }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
          Check your email
        </p>
        <p className="mt-2 text-sm" style={{ color: 'var(--text2)' }}>
          We sent a magic link to <strong>{email}</strong>. Click it to sign in.
        </p>
        <button
          onClick={() => { setSent(false); setEmail('') }}
          className="mt-4 text-xs underline"
          style={{ color: 'var(--accent2)' }}
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl p-6 space-y-4"
      style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="h-10"
        />
      </div>

      {error && (
        <p className="text-xs" style={{ color: 'var(--red)' }}>
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading || !email}
        className="w-full h-10 font-medium"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        {loading ? 'Sending…' : 'Send magic link'}
      </Button>

      <p className="text-center text-xs" style={{ color: 'var(--text3)' }}>
        No password needed. We&apos;ll email you a one-time link.
      </p>
    </form>
  )
}

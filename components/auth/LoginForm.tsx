'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const URL_ERROR_MESSAGES: Record<string, string> = {
  missing_code:   'The confirmation link was invalid or already used.',
  auth_failed:    'Authentication failed. Please try again.',
  access_denied:  'The confirmation link expired or was already used.',
}

function resolveUrlError(raw: string | null): string | null {
  if (!raw) return null
  return URL_ERROR_MESSAGES[raw] ?? `Authentication error: ${raw}`
}

interface LoginFormProps {
  urlError?: string | null
}

type Mode = 'signin' | 'signup'

export function LoginForm({ urlError }: LoginFormProps) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(resolveUrlError(urlError ?? null))
  const [signupSent, setSignupSent] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    if (mode === 'signin') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
        setLoading(false)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } else {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })
      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
      } else if (signUpData.session) {
        // Email confirmation is disabled — user is immediately authenticated.
        // Initialize the users + settings rows, then route to onboarding.
        const res = await fetch('/api/auth/setup', { method: 'POST' })
        const json = await res.json() as { redirect?: string; error?: string }
        router.push(json.redirect ?? '/onboarding')
        router.refresh()
      } else {
        // Email confirmation is enabled — user must click the link first.
        setSignupSent(true)
        setLoading(false)
      }
    }
  }

  if (signupSent) {
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
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
        </p>
        <button
          type="button"
          onClick={() => { setSignupSent(false); switchMode('signin') }}
          className="mt-4 text-xs underline"
          style={{ color: 'var(--accent2)' }}
        >
          Back to sign in
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
        <Label
          htmlFor="email"
          className="text-xs uppercase tracking-wide"
          style={{ color: 'var(--text3)' }}
        >
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

      <div className="space-y-1.5">
        <Label
          htmlFor="password"
          className="text-xs uppercase tracking-wide"
          style={{ color: 'var(--text3)' }}
        >
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          className="h-10"
          minLength={6}
        />
      </div>

      {error && (
        <p className="text-xs" style={{ color: 'var(--red)' }}>
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading || !email || !password}
        className="w-full h-10 font-medium"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        {loading
          ? mode === 'signin' ? 'Signing in…' : 'Creating account…'
          : mode === 'signin' ? 'Sign in' : 'Create account'}
      </Button>

      <p className="text-center text-xs" style={{ color: 'var(--text3)' }}>
        {mode === 'signin' ? (
          <>
            No account?{' '}
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className="underline"
              style={{ color: 'var(--accent2)' }}
            >
              Sign up free
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="underline"
              style={{ color: 'var(--accent2)' }}
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </form>
  )
}

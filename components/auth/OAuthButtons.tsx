'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function OAuthButtons() {
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleOAuth(provider: 'google' | 'apple') {
    setLoadingProvider(provider)
    setError(null)
    const supabase = createClient()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (oauthError) {
      setError(oauthError.message)
      setLoadingProvider(null)
    }
    // On success: browser redirects to provider — no further action needed
  }

  return (
    <div className="oauth-section">
      <div className="oauth-buttons">
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          disabled={loadingProvider !== null}
          className="oauth-button"
          aria-label="Continue with Google"
        >
          <span className="oauth-button__icon" aria-hidden>
            <svg viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
          </span>
          <span>{loadingProvider === 'google' ? 'Connecting…' : 'Continue with Google'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleOAuth('apple')}
          disabled={loadingProvider !== null}
          className="oauth-button"
          aria-label="Continue with Apple"
        >
          <span className="oauth-button__icon oauth-button__icon--apple" aria-hidden>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
          </span>
          <span>{loadingProvider === 'apple' ? 'Connecting…' : 'Continue with Apple'}</span>
        </button>
      </div>

      {error && (
        <p className="oauth-error">{error}</p>
      )}

      <div className="auth-divider">
        <span>or continue with email</span>
      </div>
    </div>
  )
}

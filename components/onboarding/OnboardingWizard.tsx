'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StepTargets } from './StepTargets'
import { StepAddClient } from './StepAddClient'
import { StepAddPayment } from './StepAddPayment'

interface Props {
  userId: string
}

export function OnboardingWizard({ userId }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [clientId, setClientId] = useState<string | null>(null)

  async function skip() {
    const res = await fetch('/api/onboarding/complete', { method: 'POST' })
    if (res.ok) router.push('/dashboard')
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h1 className="page-title">Get started</h1>
          <button
            onClick={skip}
            className="text-xs"
            style={{ color: 'var(--text3)' }}
          >
            Skip for now
          </button>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{
                background: n <= step ? 'var(--accent)' : 'var(--border)',
              }}
            />
          ))}
        </div>
        <p className="text-xs" style={{ color: 'var(--text3)' }}>
          Step {step} of 3
        </p>
      </div>

      {step === 1 && (
        <StepTargets
          userId={userId}
          onNext={() => setStep(2)}
          onSkip={skip}
        />
      )}
      {step === 2 && (
        <StepAddClient
          userId={userId}
          onNext={(id) => { setClientId(id); setStep(3) }}
          onSkip={skip}
        />
      )}
      {step === 3 && (
        <StepAddPayment
          userId={userId}
          clientId={clientId}
          onNext={() => router.push('/dashboard')}
          onSkip={skip}
        />
      )}
    </div>
  )
}

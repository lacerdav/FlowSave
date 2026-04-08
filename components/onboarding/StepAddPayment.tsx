'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/ui/money-input'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  userId: string
  clientId: string | null
  onNext: () => void
  onSkip: () => void
}

export function StepAddPayment({ userId, clientId, onNext, onSkip }: Props) {
  const [amount, setAmount] = useState<number | null>(null)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (amount == null || amount <= 0) {
      setError('Enter a valid amount.')
      return
    }
    setLoading(true)
    setError(null)

    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        amount,
        currency: 'USD',
        received_at: date,
        notes: notes || null,
      }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError((json as { error?: string }).error ?? 'Failed to log payment.')
      setLoading(false)
      return
    }

    // Mark onboarding complete
    await fetch('/api/onboarding/complete', { method: 'POST' })
    setLoading(false)
    onNext()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl p-6 space-y-5"
      style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}
    >
      <div>
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
          Log your first payment
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text2)' }}>
          Record a payment you received recently to seed your dashboard.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="amount" className="form-label">Amount ($)</Label>
        <MoneyInput
          id="amount"
          placeholder="1500"
          value={amount}
          onValueChange={setAmount}
          currency="USD"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="date" className="form-label">Date received</Label>
        <DatePicker
          id="date"
          value={date}
          onChange={setDate}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes" className="form-label">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Invoice #123, project deposit…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="resize-none"
        />
      </div>

      {error && <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading || !amount}
          className="flex-1 h-10"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {loading ? 'Logging…' : 'Log payment →'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={async () => {
            await fetch('/api/onboarding/complete', { method: 'POST' })
            onSkip()
          }}
          className="h-10 px-4"
          style={{ color: 'var(--text3)' }}
        >
          Skip
        </Button>
      </div>
    </form>
  )
}

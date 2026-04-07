'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  userId: string
  onNext: () => void
  onSkip: () => void
}

export function StepTargets({ userId, onNext, onSkip }: Props) {
  const [salary, setSalary] = useState('')
  const [taxPct, setTaxPct] = useState('25')
  const [budget, setBudget] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_monthly_salary: parseFloat(salary) || 0,
        tax_reserve_pct: parseFloat(taxPct) || 25,
        survival_budget: parseFloat(budget) || 0,
      }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError((json as { error?: string }).error ?? 'Failed to save. Please try again.')
      setLoading(false)
      return
    }

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
          Set your targets
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text2)' }}>
          These help FlowSave track your income goals and alert you about lean months.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="salary" className="form-label">Monthly target ($)</Label>
        <Input
          id="salary"
          type="number"
          min="0"
          step="100"
          placeholder="5000"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tax" className="form-label">Tax reserve (%)</Label>
        <Input
          id="tax"
          type="number"
          min="0"
          max="100"
          step="1"
          placeholder="25"
          value={taxPct}
          onChange={(e) => setTaxPct(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="budget" className="form-label">Survival budget ($)</Label>
        <Input
          id="budget"
          type="number"
          min="0"
          step="100"
          placeholder="2000"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />
        <p className="text-xs" style={{ color: 'var(--text3)' }}>
          Minimum income to cover essential expenses
        </p>
      </div>

      {error && <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 h-10"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {loading ? 'Saving…' : 'Continue →'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onSkip}
          className="h-10 px-4"
          style={{ color: 'var(--text3)' }}
        >
          Skip
        </Button>
      </div>
    </form>
  )
}

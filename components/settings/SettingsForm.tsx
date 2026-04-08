'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/ui/money-input'

interface Props {
  defaultValues: {
    target_monthly_salary: number
    tax_reserve_pct: number
    survival_budget: number
  }
}

export function SettingsForm({ defaultValues }: Props) {
  const [salary, setSalary] = useState<number | null>(defaultValues.target_monthly_salary || null)
  const [taxPct, setTaxPct] = useState(String(defaultValues.tax_reserve_pct || '25'))
  const [budget, setBudget] = useState<number | null>(defaultValues.survival_budget || null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError(null)

    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_monthly_salary: salary ?? 0,
        tax_reserve_pct: parseFloat(taxPct) || 25,
        survival_budget: budget ?? 0,
      }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError((json as { error?: string }).error ?? 'Failed to save settings.')
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="panel-surface-soft rounded-[18px] p-6 space-y-5"
    >
      <div className="space-y-1">
        <p className="section-label">Income targets</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="salary" className="form-label">Monthly target ($)</Label>
        <MoneyInput
          id="salary"
          placeholder="5000"
          value={salary}
          onValueChange={value => { setSalary(value); setSuccess(false) }}
          currency="USD"
        />
        <p className="small-label">Your target monthly take-home pay</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tax" className="form-label">Tax reserve (%)</Label>
        <Input
          id="tax"
          type="number"
          min="0"
          max="100"
          step="1"
          placeholder="25"
          value={taxPct}
          onChange={(e) => { setTaxPct(e.target.value); setSuccess(false) }}
        />
        <p className="small-label">Percentage set aside from each payment for taxes</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget" className="form-label">Survival budget ($)</Label>
        <MoneyInput
          id="budget"
          placeholder="2000"
          value={budget}
          onValueChange={value => { setBudget(value); setSuccess(false) }}
          currency="USD"
        />
        <p className="small-label">Minimum monthly income to cover essential expenses</p>
      </div>

      {error && <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>}

      {success && (
        <p className="text-xs font-medium" style={{ color: 'var(--green)' }}>
          Settings saved.
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="primary-cta-button h-11 px-6 font-medium"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        {loading ? 'Saving…' : 'Save settings'}
      </Button>
    </form>
  )
}

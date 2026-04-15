'use client'

import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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

const settingsSchema = z.object({
  target_monthly_salary: z.number().nullable(),
  tax_reserve_pct: z
    .string()
    .min(1, 'Enter a tax reserve percentage')
    .refine((value) => {
      const parsed = Number(value)
      return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100
    }, 'Tax reserve must be between 0 and 100'),
  survival_budget: z.number().nullable(),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export function SettingsForm({ defaultValues }: Props) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      target_monthly_salary: defaultValues.target_monthly_salary || null,
      tax_reserve_pct: String(defaultValues.tax_reserve_pct || '25'),
      survival_budget: defaultValues.survival_budget || null,
    },
  })

  async function onSubmit(values: SettingsFormValues) {
    setLoading(true)
    setSuccess(false)
    setError(null)

    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_monthly_salary: values.target_monthly_salary ?? 0,
        tax_reserve_pct: Number(values.tax_reserve_pct) || 25,
        survival_budget: values.survival_budget ?? 0,
      }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError((json as { error?: string }).error ?? 'Failed to save settings.')
    } else {
      setSuccess(true)
      reset(values)
    }

    setLoading(false)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="panel-surface rounded-[20px] p-6 sm:p-7"
      style={{ border: '1px solid var(--border)' }}
    >
      <div className="form-card-header">
        <p className="section-label">Income targets</p>
        <h2 className="form-card-title">Tune the default salary and reserve rules</h2>
        <p className="form-card-copy">
          These values power your dashboard gap, tax reserve, and lean-month decisions across the workspace.
        </p>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="salary" className="form-label">Monthly target</Label>
          <Controller
            control={control}
            name="target_monthly_salary"
            render={({ field }) => (
              <MoneyInput
                id="salary"
                placeholder="5000"
                value={field.value}
                onValueChange={(value) => {
                  setSuccess(false)
                  field.onChange(value)
                }}
                currency="USD"
              />
            )}
          />
          <p className="small-label">Your target monthly take-home pay.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget" className="form-label">Survival budget</Label>
          <Controller
            control={control}
            name="survival_budget"
            render={({ field }) => (
              <MoneyInput
                id="budget"
                placeholder="2000"
                value={field.value}
                onValueChange={(value) => {
                  setSuccess(false)
                  field.onChange(value)
                }}
                currency="USD"
              />
            )}
          />
          <p className="small-label">The minimum monthly cash you need to stay comfortable.</p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <Label htmlFor="tax" className="form-label">Tax reserve percentage</Label>
        <Input
          id="tax"
          type="number"
          min="0"
          max="100"
          step="1"
          placeholder="25"
          className="payment-control"
          aria-invalid={errors.tax_reserve_pct ? 'true' : 'false'}
          {...register('tax_reserve_pct', {
            onChange: () => setSuccess(false),
          })}
        />
        <p className="small-label">Percentage automatically reserved from each payment for taxes.</p>
        {errors.tax_reserve_pct ? (
          <p className="text-xs" style={{ color: 'var(--red)' }}>{errors.tax_reserve_pct.message}</p>
        ) : null}
      </div>

      <div className="form-cta-row mt-6" data-align="start">
        <Button
          type="submit"
          disabled={loading}
          className="primary-cta-button h-11 px-6 font-medium"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {loading ? 'Saving…' : 'Save settings'}
        </Button>

        {error ? <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p> : null}
        {success ? (
          <p className="text-xs font-medium" style={{ color: 'var(--green)' }}>
            Settings saved.
          </p>
        ) : null}
      </div>
    </form>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/ui/money-input'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { generateScheduleEntries } from '@/lib/schedule'
import { formatCurrency, formatDate, PLAN_TYPE_LABELS } from '@/lib/utils'
import type { Client, Project, ScheduleEntry, PaymentPlanType } from '@/types'

interface Props {
  project: Project
  client: Pick<Client, 'id' | 'name' | 'currency'> | null
  open: boolean
  onClose: () => void
  onSuccess: (entries: ScheduleEntry[]) => void
  existingEntries: ScheduleEntry[]
}

export function PaymentPlanModal({ project, client, open, onClose, onSuccess, existingEntries }: Props) {
  const currency = client?.currency ?? 'USD'
  const defaultAmount = project.expected_amount ?? null
  const defaultDate = project.expected_date ?? new Date().toISOString().split('T')[0]

  const [planType, setPlanType] = useState<PaymentPlanType>('one_time')
  const [totalAmount, setTotalAmount] = useState(defaultAmount)
  const [firstDate, setFirstDate] = useState(defaultDate)
  const [installmentCount, setInstallmentCount] = useState('3')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasReceived = existingEntries.some(e => e.status === 'received')
  const hasScheduled = existingEntries.some(e => e.status === 'scheduled')
  const scheduledCount = existingEntries.filter(e => e.status === 'scheduled').length

  const isInstallments = planType !== 'one_time'

  useEffect(() => {
    if (!open) {
      setSuccess(false)
      setError(null)
    }
  }, [open])

  const preview = useMemo(() => {
    if (totalAmount == null || totalAmount <= 0 || !firstDate) return []
    try {
      return generateScheduleEntries({
        planType,
        totalAmount,
        currency,
        firstDate,
        installmentCount: isInstallments ? Math.max(2, parseInt(installmentCount) || 2) : undefined,
      })
    } catch {
      return []
    }
  }, [planType, totalAmount, firstDate, installmentCount, currency, isInstallments])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (hasReceived) {
      setError('Regeneration is blocked after any entry has been received. Manage the remaining schedule on /upcoming.')
      return
    }

    if (totalAmount == null || totalAmount <= 0) {
      setError('Enter a valid amount.')
      return
    }
    if (!firstDate) {
      setError('Select a first payment date.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch(`/api/projects/${project.id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType,
          totalAmount,
          currency,
          firstDate,
          installmentCount: isInstallments ? Math.max(2, parseInt(installmentCount) || 2) : undefined,
        }),
      })
      const json = await res.json() as { entries?: ScheduleEntry[]; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to save schedule.')
      setSuccess(true)
      window.setTimeout(() => {
        onSuccess(json.entries ?? [])
      }, 180)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      window.setTimeout(() => {
        setSaving(false)
      }, 180)
    }
  }

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent
        className="sm:max-w-[520px]"
        style={{
          background: 'linear-gradient(180deg, rgba(15, 20, 45, 0.98) 0%, rgba(9, 13, 31, 0.96) 100%)',
          border: '1px solid rgba(124, 150, 255, 0.22)',
          boxShadow: '0 32px 80px rgba(2, 6, 20, 0.56), 0 0 40px rgba(50, 78, 168, 0.14)',
        }}
      >
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="dialog-title-premium">
            Payment plan
          </DialogTitle>
          <div className="payment-plan-modal-header">
            <p className="payment-plan-modal-project">
              {project.name}
            </p>
            <p className="payment-plan-modal-client" data-muted={!client ? 'true' : undefined}>
              {client?.name ?? 'No client linked'}
            </p>
          </div>
        </DialogHeader>

        {/* Warning banners */}
        {hasReceived && (
          <div
            className="rounded-lg px-4 py-3 text-xs"
            style={{ background: 'rgba(91,127,255,0.10)', border: '1px solid rgba(91,127,255,0.22)', color: 'var(--accent2)' }}
          >
            Some entries already received. Regeneration is blocked now, so manage the remaining schedule individually on /upcoming.
          </div>
        )}
        {!hasReceived && hasScheduled && (
          <div
            className="rounded-lg px-4 py-3 text-xs"
            style={{ background: 'var(--amber-dim)', border: '1px solid rgba(245,166,35,0.30)', color: 'var(--amber)' }}
          >
            This will replace the existing {scheduledCount} scheduled {scheduledCount === 1 ? 'entry' : 'entries'}.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-1 space-y-4">
          {/* Plan type */}
          <div className="space-y-1.5">
            <Label className="form-label">Plan type</Label>
            <Select
              value={planType}
              onValueChange={v => v && setPlanType(v as PaymentPlanType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select plan type">
                  {PLAN_TYPE_LABELS[planType]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PLAN_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount + date row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="plan-amount" className="form-label">
                Total amount ({currency})
              </Label>
              <MoneyInput
                id="plan-amount"
                placeholder="0.00"
                value={totalAmount}
                onValueChange={setTotalAmount}
                currency={currency}
                required
                className="payment-control"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-date" className="form-label">
                {isInstallments ? 'First payment date' : 'Payment date'}
              </Label>
              <DatePicker
                id="plan-date"
                value={firstDate}
                onChange={setFirstDate}
                className="payment-date-picker"
                triggerClassName="payment-control"
              />
            </div>
          </div>

          {/* Installment count */}
          {isInstallments && (
            <div className="space-y-1.5">
              <Label htmlFor="plan-count" className="form-label">
                Number of installments
              </Label>
              <Input
                id="plan-count"
                type="number"
                min="2"
                max="60"
                value={installmentCount}
                onChange={e => setInstallmentCount(e.target.value)}
              />
            </div>
          )}

          {/* Live preview */}
          {preview.length > 0 && (
            <div
              className="rounded-xl p-4 space-y-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
            >
              <p className="text-[10.5px] font-medium uppercase tracking-widest" style={{ color: 'var(--text3)' }}>
                Preview
              </p>
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                {preview.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <span className="text-xs truncate" style={{ color: 'var(--text2)' }}>
                      {entry.label}
                    </span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs tabular-nums" style={{ color: 'var(--text3)' }}>
                        {formatDate(entry.expected_date)}
                      </span>
                      <span
                        className="text-xs tabular-nums font-medium"
                        style={{ color: 'var(--accent2)', minWidth: 64, textAlign: 'right' }}
                      >
                        {formatCurrency(entry.amount, currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div
                className="flex items-center justify-between pt-1.5"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <span className="text-[10.5px]" style={{ color: 'var(--text3)' }}>
                  {preview.length} {preview.length === 1 ? 'payment' : 'payments'}
                </span>
                <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--accent2)' }}>
                  {formatCurrency(preview.reduce((s, e) => s + e.amount, 0), currency)}
                </span>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>
          )}
          {success && (
            <p className="text-xs" style={{ color: 'var(--green)' }}>Payment plan saved.</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving || preview.length === 0 || hasReceived}>
              {hasReceived ? 'Regeneration blocked' : success ? 'Plan saved' : saving ? 'Saving…' : 'Save plan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

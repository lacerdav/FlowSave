'use client'

import { useState } from 'react'
import { toast } from 'sonner'
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
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatDate } from '@/lib/utils'
import { apiRequest } from '@/lib/api-client'
import type { PaymentCreateResponse } from '@/types'

interface EntryDetails {
  id: string
  projectName: string
  clientName: string | null
  amount: number
  currency: string
  expectedDate: string
  label: string | null
}

interface Props {
  entry: EntryDetails | null
  open: boolean
  onClose: () => void
  onSuccess: (result: PaymentCreateResponse) => void
}

export function MarkScheduleReceivedModal({ entry, open, onClose, onSuccess }: Props) {
  if (!entry) return null

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      {open ? (
        <MarkScheduleReceivedDialog
          key={entry.id}
          entry={entry}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      ) : null}
    </Dialog>
  )
}

function MarkScheduleReceivedDialog({ entry, onClose, onSuccess }: {
  entry: EntryDetails
  onClose: () => void
  onSuccess: (result: PaymentCreateResponse) => void
}) {
  const [amount, setAmount] = useState<number | null>(entry.amount)
  const [date, setDate] = useState(entry.expectedDate)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const parsedAmount = amount ?? NaN
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a valid amount.')
      return
    }

    setLoading(true)
    setError(null)

    const json = await apiRequest<PaymentCreateResponse & { error?: string }>('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: parsedAmount,
        currency: entry.currency,
        received_at: date,
        notes: notes.trim() || null,
        schedule_entry_id: entry.id,
      }),
    }, 'Failed to mark scheduled payment as received.').catch(error => {
      setError(error instanceof Error ? error.message : 'Failed to mark scheduled payment as received.')
      setLoading(false)
      return null
    })

    if (!json) return

    setLoading(false)
    onSuccess(json)
    toast.success('Scheduled payment marked as received.')
    onClose()
  }

  return (
    <DialogContent
      className="sm:max-w-[440px]"
      style={{
        background: 'linear-gradient(180deg, rgba(15, 20, 45, 0.98) 0%, rgba(9, 13, 31, 0.96) 100%)',
        border: '1px solid rgba(148, 174, 252, 0.20)',
        boxShadow: '0 32px 80px rgba(2, 6, 20, 0.56), 0 0 40px rgba(50, 78, 168, 0.14)',
      }}
    >
      <DialogHeader className="space-y-2">
        <p className="section-label">Mark scheduled payment as received</p>
        <DialogTitle className="receive-modal__project">
          {entry.projectName}
        </DialogTitle>
        <div className="receive-modal__meta">
          <span className="receive-modal__client" data-muted={entry.clientName ? undefined : 'true'}>
            {entry.clientName ?? 'No client linked'}
          </span>
          <span className="status-chip">
            {formatCurrency(entry.amount, entry.currency)}
          </span>
        </div>
        <p className="dialog-subtitle">
          {entry.label ?? 'Scheduled payment'} due {formatDate(entry.expectedDate)}.
        </p>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="mt-1 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="schedule-receive-amount" className="form-label">Amount received</Label>
          <MoneyInput
            id="schedule-receive-amount"
            value={amount}
            onValueChange={setAmount}
            currency={entry.currency}
            disabled={loading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="schedule-receive-date" className="form-label">Date received</Label>
          <DatePicker
            id="schedule-receive-date"
            value={date}
            onChange={setDate}
            disabled={loading}
            triggerClassName="payment-control"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="schedule-receive-notes" className="form-label">Notes (optional)</Label>
          <Textarea
            id="schedule-receive-notes"
            placeholder="Invoice #, bank transfer, payout reference…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            disabled={loading}
            className="resize-none"
            style={{ minHeight: '4.5rem' }}
          />
        </div>

        {error ? (
          <p style={{ fontSize: 12, color: 'var(--red)' }}>{error}</p>
        ) : null}

        <div className="flex items-center gap-3 pt-1">
          <Button
            type="submit"
            disabled={loading || !amount}
            className="primary-cta-button h-10 px-5 font-medium flex-1"
          >
            {loading ? 'Creating payment…' : 'Confirm received'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="h-10 px-4"
            style={{ color: 'var(--text3)' }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}

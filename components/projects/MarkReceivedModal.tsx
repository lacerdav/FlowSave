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
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/ui/money-input'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { formatCurrency } from '@/lib/utils'
import { apiRequest } from '@/lib/api-client'
import type { Client, Payment, Project } from '@/types'

interface Props {
  project: Project
  client: Pick<Client, 'id' | 'name' | 'currency'> | null
  open: boolean
  onClose: () => void
  /** Called with the newly-created payment and the updated project on success */
  onSuccess: (payment: Payment, updatedProject: Project) => void
}

export function MarkReceivedModal({ project, client, open, onClose, onSuccess }: Props) {
  const currency = client?.currency ?? 'USD'
  const today = new Date().toISOString().split('T')[0]

  const [amount, setAmount] = useState<number | null>(project.expected_amount)
  const [date, setDate] = useState(today)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    if (loading) return
    setError(null)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsedAmount = amount ?? NaN
    if (isNaN(parsedAmount) || parsedAmount <= 0) return

    setLoading(true)
    setError(null)

    const json = await apiRequest<{
      project: Project
      payment: Payment
      error?: string
    }>(`/api/projects/${project.id}/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: parsedAmount,
        currency,
        received_at: date,
        notes: notes.trim() || null,
      }),
    }, 'Failed to mark as received.').catch(error => {
      setError(error instanceof Error ? error.message : 'Failed to mark as received.')
      setLoading(false)
      return null
    })

    if (!json) return

    setLoading(false)
    setError(null)
    onSuccess(json.payment, json.project)
    toast.success('Project marked as received.')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent
        className="sm:max-w-[420px]"
        style={{
          background: 'linear-gradient(180deg, rgba(15, 20, 45, 0.98) 0%, rgba(9, 13, 31, 0.96) 100%)',
          border: '1px solid rgba(148, 174, 252, 0.20)',
          boxShadow: '0 32px 80px rgba(2, 6, 20, 0.56), 0 0 40px rgba(50, 78, 168, 0.14)',
        }}
      >
        <DialogHeader className="space-y-2">
          <p className="section-label">Mark as received</p>
          <DialogTitle className="receive-modal__project">
            {project.name}
          </DialogTitle>
          <div className="receive-modal__meta">
            {client ? (
              <span className="receive-modal__client">{client.name}</span>
            ) : (
              <span className="receive-modal__client" data-muted="true">No client linked</span>
            )}
            {project.expected_amount != null ? (
              <span className="status-chip">
                {formatCurrency(project.expected_amount, currency)}
              </span>
            ) : null}
          </div>
          <p className="dialog-subtitle">
            Confirm the payment details below to move this project into the received state.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="receive-amount" className="form-label">Amount received</Label>
            <MoneyInput
              id="receive-amount"
              currency={currency}
              value={amount}
              onValueChange={setAmount}
              required
              disabled={loading}
            />
            {project.expected_amount != null && amount != null && project.expected_amount !== amount && (
              <p style={{ fontSize: 11, color: 'var(--text3)' }}>
                Expected: {formatCurrency(project.expected_amount, currency)}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="receive-date" className="form-label">Date received</Label>
            <DatePicker
              id="receive-date"
              value={date}
              onChange={setDate}
              disabled={loading}
              triggerClassName="payment-control"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="receive-notes" className="form-label">Notes (optional)</Label>
            <Textarea
              id="receive-notes"
              placeholder="Invoice #, reference…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              disabled={loading}
              className="resize-none"
              style={{ minHeight: '4.5rem' }}
            />
          </div>

          {error && (
            <p style={{ fontSize: 12, color: 'var(--red)' }}>{error}</p>
          )}

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
              onClick={handleClose}
              disabled={loading}
              className="h-10 px-4"
              style={{ color: 'var(--text3)' }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

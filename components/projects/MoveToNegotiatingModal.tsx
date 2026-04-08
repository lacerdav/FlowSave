'use client'

import { useEffect, useState } from 'react'
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
import type { Client, Project } from '@/types'

interface Props {
  project: Project
  client: Pick<Client, 'id' | 'name' | 'currency'> | null
  open: boolean
  onClose: () => void
  onSubmit: (values: {
    expected_amount?: number
    expected_date?: string
  }) => Promise<void>
}

export function MoveToNegotiatingModal({
  project,
  client,
  open,
  onClose,
  onSubmit,
}: Props) {
  const [amount, setAmount] = useState<number | null>(null)
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setAmount(project.expected_amount)
    setDate(project.expected_date ?? '')
    setError(null)
  }, [open, project])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const parsedAmount = amount

    if (parsedAmount != null && (isNaN(parsedAmount) || parsedAmount <= 0)) {
      setError('Enter a valid estimated value.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onSubmit({
        expected_amount: parsedAmount ?? undefined,
        expected_date: date || undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move project to negotiating.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={nextOpen => !nextOpen && !loading && onClose()}>
      <DialogContent
        className="sm:max-w-[440px]"
        style={{
          background: 'linear-gradient(180deg, rgba(15, 20, 45, 0.98) 0%, rgba(9, 13, 31, 0.96) 100%)',
          border: '1px solid rgba(170, 140, 255, 0.18)',
          boxShadow: '0 32px 80px rgba(2, 6, 20, 0.56), 0 0 34px rgba(139, 92, 246, 0.12)',
        }}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="dialog-title-premium">
            Move to Negotiating
          </DialogTitle>
          <p className="dialog-subtitle">
            {project.name}{client ? ` · ${client.name}` : ''} is moving into a warmer, higher-confidence stage.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-1 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="negotiating-amount" className="form-label">
              Estimated value
            </Label>
            <MoneyInput
              id="negotiating-amount"
              placeholder="Optional"
              value={amount}
              onValueChange={setAmount}
              currency={client?.currency ?? 'USD'}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="negotiating-date" className="form-label">
              Expected date
            </Label>
            <DatePicker
              id="negotiating-date"
              value={date}
              onChange={setDate}
              disabled={loading}
              triggerClassName="payment-control"
            />
          </div>

          {error ? (
            <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>
          ) : null}

          <div className="flex items-center gap-3 pt-1">
            <Button
              type="submit"
              disabled={loading}
              className="primary-cta-button h-10 px-5 font-medium flex-1"
            >
              {loading ? 'Updating…' : 'Confirm transition'}
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
    </Dialog>
  )
}

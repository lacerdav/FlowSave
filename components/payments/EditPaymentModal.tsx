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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Client, Payment } from '@/types'

interface Props {
  payment: Payment | null
  clients: Pick<Client, 'id' | 'name' | 'currency'>[]
  open: boolean
  onClose: () => void
  onSave: (
    values: {
      client_id: string | null
      amount: number
      currency: string
      received_at: string
      notes: string | null
    },
    id: string
  ) => Promise<void>
}

export function EditPaymentModal({ payment, clients, open, onClose, onSave }: Props) {
  const [clientId, setClientId] = useState('none')
  const [amount, setAmount] = useState<number | null>(null)
  const [currency, setCurrency] = useState('USD')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!payment) return
    setClientId(payment.client_id ?? 'none')
    setAmount(payment.amount)
    setCurrency(payment.currency)
    setDate(payment.received_at)
    setNotes(payment.notes ?? '')
    setError(null)
  }, [payment])

  if (!payment) return null

  function handleClientChange(value: string | null) {
    if (!value) return
    setClientId(value)
    if (value !== 'none') {
      const client = clients.find(item => item.id === value)
      if (client) setCurrency(client.currency)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!payment) return
    if (amount == null || amount <= 0) {
      setError('Enter a valid amount.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      await onSave(
        {
          client_id: clientId === 'none' ? null : clientId,
          amount,
          currency,
          received_at: date,
          notes: notes.trim() || null,
        },
        payment.id
      )
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update payment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={nextOpen => !nextOpen && !loading && onClose()}>
      <DialogContent
        className="sm:max-w-[460px]"
        style={{
          background: 'linear-gradient(180deg, rgba(15, 20, 45, 0.98) 0%, rgba(9, 13, 31, 0.96) 100%)',
          border: '1px solid rgba(148, 174, 252, 0.20)',
          boxShadow: '0 32px 80px rgba(2, 6, 20, 0.56), 0 0 40px rgba(50, 78, 168, 0.14)',
        }}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="dialog-title-premium">Edit payment</DialogTitle>
          <p className="dialog-subtitle">
            Adjust the logged amount, client, or date while keeping the payment history intact.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
            <div className="space-y-2">
              <Label htmlFor="edit-payment-amount" className="form-label">Amount</Label>
              <MoneyInput
                id="edit-payment-amount"
                currency={currency}
                value={amount}
                onValueChange={setAmount}
                disabled={loading}
                required
                wrapperClassName="payment-control-wrap"
                className="payment-control"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-payment-date" className="form-label">Received on</Label>
              <DatePicker
                id="edit-payment-date"
                value={date}
                onChange={setDate}
                disabled={loading}
                className="payment-date-picker"
                triggerClassName="payment-control"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
            <div className="space-y-2">
              <Label htmlFor="edit-payment-client" className="form-label">Client</Label>
              <Select value={clientId} onValueChange={handleClientChange}>
                <SelectTrigger className="payment-control">
                  <SelectValue placeholder="No client">
                    {(id: string | null) => {
                      if (!id || id === 'none') return 'No client'
                      return clients.find(client => client.id === id)?.name ?? 'Unknown client'
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="payment-select-content">
                  <SelectItem value="none">No client</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-payment-currency" className="form-label">Currency</Label>
              <Select value={currency} onValueChange={value => value && setCurrency(value)}>
                <SelectTrigger className="payment-control">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="payment-select-content">
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="BRL">BRL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-payment-notes" className="form-label">Notes (optional)</Label>
            <Textarea
              id="edit-payment-notes"
              value={notes}
              onChange={event => setNotes(event.target.value)}
              disabled={loading}
              rows={3}
              className="payment-control resize-none"
            />
          </div>

          {error ? <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p> : null}

          <div className="form-cta-row" data-align="center">
            <Button
              type="submit"
              disabled={loading || !amount}
              className="primary-cta-button h-11 min-w-[11rem] px-6 font-medium"
            >
              {loading ? 'Saving…' : 'Save changes'}
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

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Client, Payment } from '@/types'

interface Props {
  clients: Pick<Client, 'id' | 'name' | 'currency'>[]
  onAdd: (payment: Payment) => void
}

export function PaymentForm({ clients, onAdd }: Props) {
  const [clientId, setClientId] = useState<string>('none')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-set currency when client is selected
  function handleClientChange(id: string | null) {
    if (!id) return
    setClientId(id)
    if (id !== 'none') {
      const client = clients.find((c) => c.id === id)
      if (client) setCurrency(client.currency)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId === 'none' ? null : clientId,
        amount: parseFloat(amount),
        currency,
        received_at: date,
        notes: notes || null,
      }),
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError((json as { error?: string }).error ?? 'Failed to log payment.')
      setLoading(false)
      return
    }

    onAdd(json as Payment)
    setAmount('')
    setNotes('')
    setClientId('none')
    setDate(new Date().toISOString().split('T')[0])
    setLoading(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="payment-form panel-surface-soft rounded-[20px] p-6 sm:p-7"
    >
      <p className="section-label">Log payment</p>

      <div className="payment-form-grid">
        <div className="payment-field">
          <Label htmlFor="payment-amount" className="form-label">Amount</Label>
          <div className="payment-control-wrap">
            <span className="payment-currency-symbol">
              {currency === 'BRL' ? 'R$' : '$'}
            </span>
            <Input
              id="payment-amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={loading}
              className={`payment-control payment-amount-input ${currency === 'BRL' ? 'pl-11' : 'pl-9'}`}
            />
          </div>
        </div>

        <div className="payment-field">
          <Label htmlFor="payment-date" className="form-label">Date received</Label>
          <DatePicker
            id="payment-date"
            value={date}
            onChange={setDate}
            disabled={loading}
            className="payment-date-picker"
          />
        </div>

        <div className="payment-field">
          <Label htmlFor="payment-client" className="form-label">Client (optional)</Label>
          <Select value={clientId} onValueChange={handleClientChange}>
            <SelectTrigger className="payment-control payment-select-trigger">
              <SelectValue placeholder="Select client">
                {(id: string | null) => {
                  if (!id || id === 'none') return 'No client'
                  return clients.find((c) => c.id === id)?.name ?? 'Unknown client'
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="payment-select-content">
              <SelectItem value="none">No client</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="payment-field">
          <Label htmlFor="payment-currency" className="form-label">Currency</Label>
          <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
            <SelectTrigger className="payment-control payment-select-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="payment-select-content">
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="BRL">BRL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="payment-field">
        <Label htmlFor="payment-notes" className="form-label">Notes (optional)</Label>
        <Textarea
          id="payment-notes"
          placeholder="Invoice #123, project deposit…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          disabled={loading}
          className="payment-control payment-notes resize-none"
        />
      </div>

      {error && <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>}

      <Button
        type="submit"
        disabled={loading || !amount}
        className="payment-submit primary-cta-button h-11 px-6"
      >
        {loading ? 'Logging…' : 'Log payment'}
      </Button>
    </form>
  )
}

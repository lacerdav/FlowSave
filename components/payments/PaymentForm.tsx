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
      className="panel-surface-soft rounded-[18px] p-6 space-y-5"
    >
      <p className="section-label">Log payment</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="payment-amount" className="section-label">Amount</Label>
          <div className="relative">
            <span
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none select-none"
              style={{ color: 'var(--text3)' }}
            >
              {currency === 'BRL' ? 'R$' : '$'}
            </span>
            <Input
              id="payment-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={loading}
              className={currency === 'BRL' ? 'pl-9' : 'pl-7'}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="payment-date" className="section-label">Date received</Label>
          <DatePicker
            id="payment-date"
            value={date}
            onChange={setDate}
            disabled={loading}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="payment-client" className="section-label">Client (optional)</Label>
          <Select value={clientId} onValueChange={handleClientChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select client">
                {(id: string | null) => {
                  if (!id || id === 'none') return 'No client'
                  return clients.find((c) => c.id === id)?.name ?? 'Unknown client'
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No client</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="payment-currency" className="section-label">Currency</Label>
          <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="BRL">BRL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="payment-notes" className="section-label">Notes (optional)</Label>
        <Textarea
          id="payment-notes"
          placeholder="Invoice #123, project deposit…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          disabled={loading}
          className="resize-none"
        />
      </div>

      {error && <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>}

      <Button
        type="submit"
        disabled={loading || !amount}
        className="h-11 px-6 font-medium"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        {loading ? 'Logging…' : 'Log payment'}
      </Button>
    </form>
  )
}

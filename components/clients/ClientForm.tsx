'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Client } from '@/types'

interface Props {
  onAdd: (client: Client) => void
  onLimitReached: () => void
  plan: 'free' | 'pro'
  clientCount: number
}

export function ClientForm({ onAdd, onLimitReached, plan, clientCount }: Props) {
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Client-side gate: open upgrade modal immediately
    if (plan === 'free' && clientCount >= 2) {
      onLimitReached()
      return
    }

    setLoading(true)
    setError(null)

    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, currency }),
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      if (res.status === 403) {
        onLimitReached()
      } else {
        setError((json as { error?: string }).error ?? 'Failed to add client.')
      }
      setLoading(false)
      return
    }

    onAdd(json as Client)
    setName('')
    setCurrency('USD')
    setLoading(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="panel-surface-soft card-interactive rounded-[18px] p-6 space-y-5"
    >
      <div className="form-card-header">
        <p className="section-label">Add client</p>
        <h2 className="form-card-title">Create a client card</h2>
        <p className="form-card-copy">
          Keep client records as polished as the Projects page, with stronger hierarchy and cleaner spacing.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="client-name" className="form-label">Name</Label>
          <Input
            id="client-name"
            type="text"
            placeholder="Acme Corp"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
            className="payment-control"
          />
        </div>

        <div className="w-full sm:w-36 space-y-1.5">
          <Label htmlFor="currency" className="form-label">Currency</Label>
          <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
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

      {error && <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>}

      <div className="form-cta-row" data-align="center">
        <Button
          type="submit"
          disabled={loading || !name}
          className="primary-cta-button h-11 min-w-[12rem] px-6 font-medium whitespace-nowrap"
        >
          {loading ? 'Adding…' : 'Add client'}
        </Button>
      </div>
    </form>
  )
}

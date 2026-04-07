'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Props {
  userId: string
  onNext: (clientId: string) => void
  onSkip: () => void
}

export function StepAddClient({ userId, onNext, onSkip }: Props) {
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, currency }),
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError((json as { error?: string }).error ?? 'Failed to add client.')
      setLoading(false)
      return
    }

    setLoading(false)
    onNext((json as { id: string }).id)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl p-6 space-y-5"
      style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}
    >
      <div>
        <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
          Add your first client
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text2)' }}>
          You can add more clients later from the Clients page.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="client-name" className="form-label">Client name</Label>
        <Input
          id="client-name"
          type="text"
          placeholder="Acme Corp"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="currency" className="form-label">Currency</Label>
        <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD — US Dollar</SelectItem>
            <SelectItem value="BRL">BRL — Brazilian Real</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading || !name}
          className="flex-1 h-10"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {loading ? 'Adding…' : 'Add client →'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onSkip}
          className="h-10 px-4"
          style={{ color: 'var(--text3)' }}
        >
          Skip
        </Button>
      </div>
    </form>
  )
}

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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiRequest } from '@/lib/api-client'
import type { Client } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (client: Client) => void
  onLimitReached: () => void
  plan: 'free' | 'pro'
  clientCount: number
}

export function AddClientModal({ open, onClose, onAdd, onLimitReached, plan, clientCount }: Props) {
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    if (!next && !loading) {
      setName('')
      setCurrency('USD')
      setError(null)
      onClose()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (plan === 'free' && clientCount >= 2) {
      onLimitReached()
      onClose()
      return
    }

    setLoading(true)
    setError(null)

    try {
      const json = await apiRequest<Client>('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), currency }),
      }, 'Failed to add client.')

      onAdd(json)
      setName('')
      setCurrency('USD')
      setError(null)
      setLoading(false)
      toast.success('Client added.')
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add client.'

      if (message.includes('limited to 2 clients')) {
        onLimitReached()
        onClose()
      } else {
        setError(message)
      }

      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[430px]"
        style={{
          background: 'linear-gradient(180deg, rgba(15, 20, 45, 0.98) 0%, rgba(9, 13, 31, 0.96) 100%)',
          border: '1px solid rgba(148, 174, 252, 0.20)',
          boxShadow: '0 32px 80px rgba(2, 6, 20, 0.56), 0 0 40px rgba(50, 78, 168, 0.14)',
        }}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="dialog-title-premium">Add client</DialogTitle>
          <p className="dialog-subtitle">
            Create a new client card. All projects and payments can be linked to it.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="add-client-name" className="form-label">Client name</Label>
            <Input
              id="add-client-name"
              type="text"
              placeholder="Acme Corp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              className="payment-control"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-client-currency" className="form-label">Currency</Label>
            <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
              <SelectTrigger id="add-client-currency" className="payment-control">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="payment-select-content">
                <SelectItem value="USD">USD — US Dollar</SelectItem>
                <SelectItem value="BRL">BRL — Brazilian Real</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>}

          <div className="form-cta-row" data-align="center">
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="primary-cta-button h-11 min-w-[10rem] px-6 font-medium"
            >
              {loading ? 'Adding…' : 'Add client'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
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

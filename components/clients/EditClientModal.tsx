'use client'

import { useEffect, useState } from 'react'
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
import type { ClientWithStats } from '@/lib/supabase/queries/clients'

interface Props {
  client: ClientWithStats | null
  open: boolean
  onClose: () => void
  onSave: (values: { name: string; currency: string }, id: string) => Promise<void>
}

export function EditClientModal({ client, open, onClose, onSave }: Props) {
  const [name, setName]         = useState('')
  const [currency, setCurrency] = useState('USD')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!client) return
    setName(client.name)
    setCurrency(client.currency)
    setError(null)
  }, [client])

  if (!client) return null

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!client) return
    setLoading(true)
    setError(null)

    try {
      await onSave({ name: name.trim(), currency }, client.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update client.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={nextOpen => !nextOpen && !loading && onClose()}>
      <DialogContent
        className="sm:max-w-[430px]"
        style={{
          background: 'linear-gradient(180deg, rgba(15, 20, 45, 0.98) 0%, rgba(9, 13, 31, 0.96) 100%)',
          border: '1px solid rgba(148, 174, 252, 0.20)',
          boxShadow: '0 32px 80px rgba(2, 6, 20, 0.56), 0 0 40px rgba(50, 78, 168, 0.14)',
        }}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="dialog-title-premium">Edit client</DialogTitle>
          <p className="dialog-subtitle">
            Update the client name or preferred currency without leaving the card grid.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="edit-client-name" className="form-label">Client name</Label>
            <Input
              id="edit-client-name"
              value={name}
              onChange={event => setName(event.target.value)}
              disabled={loading}
              className="payment-control"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-client-currency" className="form-label">Currency</Label>
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

          {error ? <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p> : null}

          <div className="form-cta-row" data-align="center">
            <Button
              type="submit"
              disabled={loading || !name.trim()}
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

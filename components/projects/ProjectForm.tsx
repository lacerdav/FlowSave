'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Client, Project, ProjectStatus } from '@/types'

interface ProjectFormValues {
  name: string
  client_id: string | null
  expected_amount: string
  expected_date: string
  status: ProjectStatus
}

interface Props {
  clients: Pick<Client, 'id' | 'name' | 'currency'>[]
  editing: Project | null
  onSave: (
    values: Omit<ProjectFormValues, 'expected_amount'> & { expected_amount: number },
    editingId: string | null
  ) => Promise<void>
  onCancel: () => void
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'pending',   label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'received',  label: 'Received' },
  { value: 'cancelled', label: 'Cancelled' },
]

function blankState(): ProjectFormValues {
  return {
    name: '',
    client_id: null,
    expected_amount: '',
    expected_date: new Date().toISOString().split('T')[0],
    status: 'pending',
  }
}

function fromProject(p: Project): ProjectFormValues {
  return {
    name: p.name,
    client_id: p.client_id,
    expected_amount: String(p.expected_amount),
    expected_date: p.expected_date,
    status: p.status,
  }
}

export function ProjectForm({ clients, editing, onSave, onCancel }: Props) {
  const [fields, setFields] = useState<ProjectFormValues>(
    editing ? fromProject(editing) : blankState()
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync form when editing target changes
  useEffect(() => {
    setFields(editing ? fromProject(editing) : blankState())
    setError(null)
  }, [editing])

  const selectedClient = fields.client_id
    ? clients.find(c => c.id === fields.client_id)
    : null
  const currencySymbol = selectedClient?.currency === 'BRL' ? 'R$' : '$'

  function handleClientChange(value: string | null) {
    if (!value) return
    const id = value === 'none' ? null : value
    setFields(prev => ({ ...prev, client_id: id }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const amount = parseFloat(fields.expected_amount)
    if (!fields.name.trim() || isNaN(amount) || amount <= 0) return

    setLoading(true)
    setError(null)

    try {
      await onSave(
        {
          name: fields.name.trim(),
          client_id: fields.client_id,
          expected_amount: amount,
          expected_date: fields.expected_date,
          status: fields.status,
        },
        editing?.id ?? null
      )
      if (!editing) {
        setFields(blankState())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const isEdit = editing !== null

  return (
    <form
      onSubmit={handleSubmit}
      className="panel-surface-soft rounded-[18px] p-6 space-y-5"
    >
      <p className="section-label">{isEdit ? 'Edit project' : 'New project'}</p>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="proj-name" className="form-label">Project name</Label>
        <Input
          id="proj-name"
          type="text"
          placeholder="Website redesign, Branding package…"
          value={fields.name}
          onChange={e => setFields(prev => ({ ...prev, name: e.target.value }))}
          required
          disabled={loading}
        />
      </div>

      {/* Row: client + amount — CSS grid keeps the right column at a fixed 10rem so
           it stays perfectly aligned with the Status column in the row below */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_10rem] gap-3">
        <div className="space-y-2">
          <Label htmlFor="proj-client" className="form-label">Client (optional)</Label>
          <Select
            value={fields.client_id ?? 'none'}
            onValueChange={handleClientChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="No client">
                {(v: string | null) => {
                  if (!v || v === 'none') return 'No client'
                  return clients.find(c => c.id === v)?.name ?? 'Unknown'
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No client</SelectItem>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="proj-amount" className="form-label">Expected amount</Label>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none pointer-events-none"
              style={{ color: 'var(--text3)' }}
            >
              {currencySymbol}
            </span>
            <Input
              id="proj-amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={fields.expected_amount}
              onChange={e => setFields(prev => ({ ...prev, expected_amount: e.target.value }))}
              required
              disabled={loading}
              className={selectedClient?.currency === 'BRL' ? 'pl-11' : 'pl-9'}
            />
          </div>
        </div>
      </div>

      {/* Row: date + status — right column locked to same 10rem as amount above */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_10rem] gap-3">
        <div className="space-y-2">
          <Label htmlFor="proj-date" className="form-label">Expected date</Label>
          <DatePicker
            id="proj-date"
            value={fields.expected_date}
            onChange={v => setFields(prev => ({ ...prev, expected_date: v }))}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="proj-status" className="form-label">Status</Label>
          <Select
            value={fields.status}
            onValueChange={(v: string | null) => v && setFields(prev => ({ ...prev, status: v as ProjectStatus }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={loading || !fields.name.trim() || !fields.expected_amount}
          className="primary-cta-button h-11 px-5 font-medium"
        >
          {loading
            ? isEdit ? 'Saving…' : 'Adding…'
            : isEdit ? 'Save changes' : 'Add project'}
        </Button>

        {isEdit && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
            className="h-11 px-4"
            style={{ color: 'var(--text3)' }}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

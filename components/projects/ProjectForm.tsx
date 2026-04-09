'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { MoneyInput } from '@/components/ui/money-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Client, EditableProjectStatus, Project, ProjectStatus, ProjectSubStatus } from '@/types'

interface ProjectFormValues {
  name: string
  client_id: string | null
  expected_amount: number | null
  expected_date: string
  status: ProjectStatus
  sub_status: ProjectSubStatus | null
}

interface Props {
  clients: Pick<Client, 'id' | 'name' | 'currency'>[]
  editing: Project | null
  onSave: (
    values: Omit<ProjectFormValues, 'expected_amount' | 'expected_date'> & {
      expected_amount: number | null
      expected_date: string | null
    },
    editingId: string | null
  ) => Promise<void>
  onCancel: () => void
  surface?: 'panel' | 'none'
  showHeader?: boolean
  initialValues?: Partial<ProjectFormValues>
  submitLabel?: string
  title?: string
  description?: string
  allowStateEditing?: boolean
  onStatusChange?: (status: ProjectStatus, subStatus: ProjectSubStatus | null) => void
}

const STATUS_OPTIONS: { value: EditableProjectStatus; label: string }[] = [
  { value: 'pending',   label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
]

const SUB_STATUS_OPTIONS: { value: ProjectSubStatus; label: string }[] = [
  { value: 'prospecting', label: 'Prospecting' },
  { value: 'negotiating', label: 'Negotiating' },
]

function blankState(initialValues?: Partial<ProjectFormValues>): ProjectFormValues {
  return {
    name: initialValues?.name ?? '',
    client_id: initialValues?.client_id ?? null,
    expected_amount: initialValues?.expected_amount ?? null,
    expected_date: initialValues?.expected_date ?? '',
    status: initialValues?.status ?? 'pending',
    sub_status: initialValues?.sub_status ?? 'prospecting',
  }
}

function fromProject(p: Project): ProjectFormValues {
  return {
    name: p.name,
    client_id: p.client_id,
    expected_amount: p.expected_amount,
    expected_date: p.expected_date ?? '',
    status: p.status,
    sub_status: p.sub_status ?? 'prospecting',
  }
}

export function ProjectForm({
  clients,
  editing,
  onSave,
  onCancel,
  surface = 'panel',
  showHeader = true,
  initialValues,
  submitLabel,
  title,
  description,
  allowStateEditing = true,
  onStatusChange,
}: Props) {
  const [fields, setFields] = useState<ProjectFormValues>(
    editing ? fromProject(editing) : blankState(initialValues)
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setFields(editing ? fromProject(editing) : blankState(initialValues))
    setError(null)
  }, [editing, initialValues])

  const isPending = fields.status === 'pending'
  const selectedClient = fields.client_id
    ? clients.find(c => c.id === fields.client_id)
    : null

  function handleClientChange(value: string | null) {
    if (!value) return
    const id = value === 'none' ? null : value
    setFields(prev => ({ ...prev, client_id: id }))
  }

  function handleStatusChange(value: string | null) {
    if (!value) return
    const status = value as ProjectStatus
    const newSubStatus = status === 'pending' ? (fields.sub_status ?? 'prospecting') : null
    setFields(prev => ({
      ...prev,
      status,
      sub_status: newSubStatus,
    }))
    onStatusChange?.(status, newSubStatus)
  }

  const isEdit = editing !== null
  const canEditStatus = allowStateEditing && (!editing || editing.status === 'pending' || editing.status === 'confirmed')
  const canEditSubStatus = allowStateEditing && !isEdit && isPending
  const resolvedStatus = canEditStatus ? fields.status : (editing?.status ?? fields.status)
  const resolvedSubStatus = canEditStatus
    ? (fields.status === 'pending' ? fields.sub_status : null)
    : (editing?.sub_status ?? null)
  const requiresAmountAndDate = resolvedStatus === 'confirmed'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!fields.name.trim()) return

    const amount = fields.expected_amount

    if (requiresAmountAndDate) {
      if (amount === null || isNaN(amount) || amount <= 0) return
      if (!fields.expected_date) return
    }

    setLoading(true)
    setError(null)

    try {
      await onSave(
        {
          name: fields.name.trim(),
          client_id: fields.client_id,
          expected_amount: amount,
          expected_date: fields.expected_date || null,
          status: resolvedStatus,
          sub_status: resolvedSubStatus,
        },
        editing?.id ?? null
      )
      if (!editing) {
        setFields(blankState(initialValues))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  // Submit enabled when name filled; confirmed also needs amount
  const submitDisabled = loading
    || !fields.name.trim()
    || (requiresAmountAndDate && ((fields.expected_amount ?? 0) <= 0 || !fields.expected_date))

  return (
    <form
      onSubmit={handleSubmit}
      className={
        surface === 'panel'
          ? 'panel-surface-soft card-interactive rounded-[18px] p-6 space-y-5'
          : 'space-y-5'
      }
    >
      {showHeader ? (
        <div className="form-card-header">
          <p className="section-label">{isEdit ? 'Edit project' : 'New project'}</p>
          <h2 className="form-card-title">
            {title ?? (isEdit ? 'Refine this project' : 'Add a future payment')}
          </h2>
          <p className="form-card-copy">
            {description ?? 'Track expected work, amount, and timing with the same polished structure used across the app.'}
          </p>
        </div>
      ) : null}

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="proj-name" className="form-label">
          Project name
          <span style={{ color: 'rgba(255,91,127,0.85)', marginLeft: '3px', fontSize: '11px', textShadow: '0 0 5px rgba(255,91,127,0.55)' }}>*</span>
        </Label>
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

      {/* Row: client + status */}
      <div className={`grid gap-3 ${canEditStatus ? 'grid-cols-1 sm:grid-cols-[1fr_10rem]' : 'grid-cols-1'}`}>
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

        {canEditStatus ? (
          <div className="space-y-2">
            <Label htmlFor="proj-status" className="form-label">Status</Label>
            <Select
              value={fields.status}
              onValueChange={handleStatusChange}
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
        ) : null}
      </div>

      {/* Sub-status row — only when pending */}
      {canEditSubStatus ? (
        <div className="space-y-2">
          <Label htmlFor="proj-sub-status" className="form-label">Stage</Label>
          <Select
            value={fields.sub_status ?? 'prospecting'}
            onValueChange={(v: string | null) => {
              if (!v) return
              const newSubStatus = v as ProjectSubStatus
              setFields(prev => ({ ...prev, sub_status: newSubStatus }))
              onStatusChange?.(fields.status, newSubStatus)
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUB_STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {/* Row: amount + date — layout adapts by status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="proj-amount" className="form-label">
            {resolvedStatus === 'pending' ? 'Estimated value' : 'Expected amount'}
            {resolvedStatus === 'pending'
              ? <span style={{ color: 'var(--text3)', fontWeight: 400 }}> (optional)</span>
              : <span style={{ color: 'rgba(255,91,127,0.85)', marginLeft: '3px', fontSize: '11px', textShadow: '0 0 5px rgba(255,91,127,0.55)' }}>*</span>}
          </Label>
          <MoneyInput
            id="proj-amount"
            currency={selectedClient?.currency ?? 'USD'}
            placeholder={resolvedStatus === 'pending' ? 'Value TBD' : '0.00'}
            value={fields.expected_amount}
            onValueChange={value => setFields(prev => ({ ...prev, expected_amount: value }))}
            required={requiresAmountAndDate}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="proj-date" className="form-label">
            Expected date
            {resolvedStatus === 'pending'
              ? <span style={{ color: 'var(--text3)', fontWeight: 400 }}> (optional)</span>
              : <span style={{ color: 'rgba(255,91,127,0.85)', marginLeft: '3px', fontSize: '11px', textShadow: '0 0 5px rgba(255,91,127,0.55)' }}>*</span>}
          </Label>
          <DatePicker
            id="proj-date"
            value={fields.expected_date}
            onChange={v => setFields(prev => ({ ...prev, expected_date: v }))}
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>
      )}

      <div className="form-cta-row" data-align={isEdit ? 'start' : 'center'}>
        <Button
          type="submit"
          disabled={submitDisabled}
          className="primary-cta-button h-11 min-w-[12rem] px-6 font-medium"
        >
          {loading
            ? isEdit ? 'Saving…' : 'Adding…'
            : submitLabel ?? (isEdit ? 'Save changes' : 'Add project')}
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

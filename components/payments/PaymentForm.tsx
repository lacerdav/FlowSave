'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/ui/money-input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CreateProjectFromPaymentModal } from '@/components/projects/CreateProjectFromPaymentModal'
import type {
  Client,
  EditableProjectStatus,
  PaymentCreateResponse,
  Project,
  ScheduleEntryWithContext,
} from '@/types'

interface Props {
  clients: Pick<Client, 'id' | 'name' | 'currency'>[]
  projects: Project[]
  scheduleEntries?: ScheduleEntryWithContext[]
  onAdd: (result: PaymentCreateResponse) => void
  onProjectAdd: (project: Project) => void
  surface?: 'panel' | 'none'
  showHeader?: boolean
}

const CREATE_PROJECT_OPTION = '__create_project__'

export function PaymentForm({ clients, projects, scheduleEntries = [], onAdd, onProjectAdd, surface = 'panel', showHeader = true }: Props) {
  const [clientId, setClientId] = useState<string>('none')
  const [projectId, setProjectId] = useState<string>('none')
  const [scheduleEntryId, setScheduleEntryId] = useState<string>('none')
  const [amount, setAmount] = useState<number | null>(null)
  const [currency, setCurrency] = useState('USD')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false)

  const pendingScheduleEntries = scheduleEntries.filter(e => e.status === 'scheduled')

  const activeProjects = projects.filter(
    project => project.status === 'pending' || project.status === 'confirmed'
  )
  const selectedScheduleEntry = scheduleEntryId !== 'none'
    ? pendingScheduleEntries.find(entry => entry.id === scheduleEntryId) ?? null
    : null
  const selectedProject = projectId !== 'none'
    ? activeProjects.find(project => project.id === projectId) ?? null
    : null
  const isScheduleLocked = selectedScheduleEntry != null

  function handleScheduleEntryChange(value: string | null) {
    if (!value) return
    setScheduleEntryId(value)
    if (value === 'none') {
      setProjectId('none')
      return
    }

    const entry = pendingScheduleEntries.find(e => e.id === value)
    if (!entry) return

    setAmount(entry.amount)
    setDate(entry.expected_date)
    setCurrency(entry.currency)
    setClientId(entry.client_id ?? 'none')
    setProjectId(entry.project_id)
  }

  function handleClientChange(id: string | null) {
    if (!id) return
    setClientId(id)
    if (id !== 'none') {
      const client = clients.find((c) => c.id === id)
      if (client) setCurrency(client.currency)
    }
  }

  function applyProjectDefaults(project: Project) {
    setScheduleEntryId('none')
    setProjectId(project.id)

    if (project.client_id) {
      setClientId(project.client_id)
      const linkedClient = clients.find(client => client.id === project.client_id)
      if (linkedClient) {
        setCurrency(linkedClient.currency)
      }
    } else {
      setClientId('none')
    }

    if (amount == null && project.expected_amount != null) {
      setAmount(project.expected_amount)
    }
  }

  function handleProjectChange(value: string | null) {
    if (!value) return

    if (value === CREATE_PROJECT_OPTION) {
      setShowCreateProjectModal(true)
      return
    }

    if (value === 'none') {
      setScheduleEntryId('none')
      setProjectId('none')
      return
    }

    const project = activeProjects.find(item => item.id === value)
    if (!project) return
    applyProjectDefaults(project)
  }

  async function handleCreateProject(values: {
    name: string
    client_id: string | null
    expected_amount: number | null
    expected_date: string | null
    status: EditableProjectStatus
    sub_status: import('@/types').ProjectSubStatus | null
  }) {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    const json = await res.json().catch(() => ({})) as Project & { error?: string }

    if (!res.ok) {
      throw new Error(json.error ?? 'Failed to create project.')
    }

    onProjectAdd(json)
    applyProjectDefaults(json)
    setShowCreateProjectModal(false)
    return json
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (amount == null || amount <= 0) {
      setError('Enter a valid amount.')
      return
    }
    setLoading(true)
    setError(null)

    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId === 'none' ? null : clientId,
        amount,
        currency,
        received_at: date,
        notes: notes || null,
        project_id: projectId === 'none' ? null : projectId,
        schedule_entry_id: scheduleEntryId === 'none' ? null : scheduleEntryId,
      }),
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError((json as { error?: string }).error ?? 'Failed to log payment.')
      setLoading(false)
      return
    }

    onAdd(json as PaymentCreateResponse)
    setAmount(null)
    setNotes('')
    setClientId('none')
    setProjectId('none')
    setScheduleEntryId('none')
    setDate(new Date().toISOString().split('T')[0])
    setLoading(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={surface === 'panel' ? 'payment-form panel-surface-soft card-interactive rounded-[20px] p-6 sm:p-7' : 'payment-form space-y-4'}
    >
      {showHeader && (
        <div className="form-card-header">
          <p className="section-label">Log payment</p>
          <h2 className="form-card-title">Capture money with confidence</h2>
          <p className="form-card-copy">
            Match the Projects page rhythm with clear fields, stronger hierarchy, and a cleaner payment entry flow.
          </p>
        </div>
      )}

      <div className="payment-form-grid">
        <div className="payment-field">
          <Label htmlFor="payment-amount" className="form-label">
            Amount
            <span style={{ color: 'rgba(255,91,127,0.85)', marginLeft: '3px', fontSize: '11px', textShadow: '0 0 5px rgba(255,91,127,0.55)' }}>*</span>
          </Label>
          <MoneyInput
            id="payment-amount"
            currency={currency}
            value={amount}
            onValueChange={setAmount}
            required
            disabled={loading}
            wrapperClassName="payment-control-wrap"
            className="payment-control payment-amount-input"
          />
        </div>

        <div className="payment-field">
          <Label htmlFor="payment-date" className="form-label">
            Date received
            <span style={{ color: 'rgba(255,91,127,0.85)', marginLeft: '3px', fontSize: '11px', textShadow: '0 0 5px rgba(255,91,127,0.55)' }}>*</span>
          </Label>
          <DatePicker
            id="payment-date"
            value={date}
            onChange={setDate}
            disabled={loading}
            className="payment-date-picker"
            triggerClassName="payment-control"
          />
        </div>

        <div className="payment-field">
          <Label htmlFor="payment-client" className="form-label">Client (optional)</Label>
          <Select value={clientId} onValueChange={handleClientChange}>
            <SelectTrigger className="payment-control payment-select-trigger" disabled={loading || isScheduleLocked}>
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
          <Label htmlFor="payment-project" className="form-label">Project (optional)</Label>
          <Select value={projectId} onValueChange={handleProjectChange}>
            <SelectTrigger className="payment-control payment-select-trigger" disabled={loading || isScheduleLocked}>
              <SelectValue placeholder="Link a project">
                {(id: string | null) => {
                  if (!id || id === 'none') return 'No project linked'
                  if (id === CREATE_PROJECT_OPTION) return '+ Create new project'
                  return activeProjects.find(project => project.id === id)?.name ?? 'Linked project'
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="payment-select-content">
              <SelectItem value="none">No project linked</SelectItem>
              {activeProjects.map(project => (
                <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
              ))}
              <SelectItem value={CREATE_PROJECT_OPTION}>+ Create new project</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="payment-field">
          <Label htmlFor="payment-currency" className="form-label">Currency</Label>
          <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
            <SelectTrigger className="payment-control payment-select-trigger" disabled={loading || isScheduleLocked}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="payment-select-content">
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="BRL">BRL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {pendingScheduleEntries.length > 0 && (
        <div className="payment-field">
          <Label htmlFor="payment-schedule-entry" className="form-label">
            Link to scheduled payment (optional)
          </Label>
          <Select value={scheduleEntryId} onValueChange={handleScheduleEntryChange}>
            <SelectTrigger className="payment-control payment-select-trigger">
              <SelectValue placeholder="Select a scheduled entry">
                {(id: string | null) => {
                  if (!id || id === 'none') return 'No scheduled entry linked'
                  const entry = pendingScheduleEntries.find(e => e.id === id)
                  if (!entry) return 'Scheduled entry'
                  return `${entry.project_name} · ${entry.label ?? 'Payment'} · ${formatDate(entry.expected_date)} · ${formatCurrency(entry.amount, entry.currency)}`
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="payment-select-content">
              <SelectItem value="none">No scheduled entry linked</SelectItem>
              {pendingScheduleEntries.map(entry => (
                <SelectItem key={entry.id} value={entry.id}>
                  {entry.project_name} · {entry.label ?? 'Payment'} · {formatDate(entry.expected_date)} · {formatCurrency(entry.amount, entry.currency)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedProject ? (
        <div className="linked-project-banner">
          <div className="space-y-1">
            <p className="linked-project-banner__title">{selectedProject.name}</p>
            <p className="linked-project-banner__copy">
              {selectedProject.client_id
                ? `Linked to ${clients.find(client => client.id === selectedProject.client_id)?.name ?? 'a client'}`
                : 'No client attached'}
              {' · '}
              {selectedScheduleEntry
                ? `Scheduled ${selectedScheduleEntry.label ?? 'payment'}`
                : selectedProject.status === 'confirmed'
                ? 'Confirmed project'
                : 'Pending project'}
            </p>
          </div>
          <span className="status-chip">
            {selectedScheduleEntry
              ? formatDate(selectedScheduleEntry.expected_date)
              : selectedProject.expected_date
              ? formatDate(selectedProject.expected_date)
              : 'To be defined'}
          </span>
        </div>
      ) : null}

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

      <div className="form-cta-row" data-align="center">
        <Button
          type="submit"
          disabled={loading || !amount}
          className="payment-submit primary-cta-button h-11 min-w-[12rem] px-6"
        >
          {loading ? 'Logging…' : 'Log payment'}
        </Button>
      </div>

      <CreateProjectFromPaymentModal
        open={showCreateProjectModal}
        clients={clients}
        initialValues={{
          client_id: clientId === 'none' ? null : clientId,
          expected_amount: amount,
          expected_date: date,
          status: 'pending',
        }}
        onClose={() => setShowCreateProjectModal(false)}
        onCreate={handleCreateProject}
      />
    </form>
  )
}

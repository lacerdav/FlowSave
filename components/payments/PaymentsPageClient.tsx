'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmActionModal } from '@/components/shared/ConfirmActionModal'
import { AddPaymentModal } from './AddPaymentModal'
import { EditPaymentModal } from './EditPaymentModal'
import { PaymentList } from './PaymentList'
import { apiRequest } from '@/lib/api-client'
import type {
  Client,
  Payment,
  PaymentCreateResponse,
  Project,
  ScheduleEntry,
  ScheduleEntryWithContext,
} from '@/types'

interface Props {
  initialPayments: Payment[]
  clients: Pick<Client, 'id' | 'name' | 'currency'>[]
  projects: Project[]
  scheduleEntries: ScheduleEntry[]
}

const SKIP_PAYMENT_DELETE_CONFIRM_KEY = 'flowsave-skip-payment-delete-confirm'

export function PaymentsPageClient({ initialPayments, clients, projects, scheduleEntries }: Props) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments)
  const [projectOptions, setProjectOptions] = useState<Project[]>(projects)
  const clientMap = new Map(clients.map(client => [client.id, client]))
  const [pendingScheduleEntries, setPendingScheduleEntries] = useState<ScheduleEntryWithContext[]>(
    scheduleEntries
      .filter(e => e.status === 'scheduled')
      .map(entry => {
        const project = projects.find(item => item.id === entry.project_id)
        const client = project?.client_id ? clientMap.get(project.client_id) ?? null : null

        return {
          ...entry,
          client_id: project?.client_id ?? null,
          client_name: client?.name ?? null,
          project_name: project?.name ?? 'Unknown project',
        }
      })
  )
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [confirmingDeletePayment, setConfirmingDeletePayment] = useState<Payment | null>(null)

  function handleAdd(result: PaymentCreateResponse) {
    setPayments((prev) => [result.payment, ...prev])

    if (result.linked_schedule_entry_id) {
      setPendingScheduleEntries(prev =>
        prev.filter(entry => entry.id !== result.linked_schedule_entry_id)
      )
    }
  }

  function handleProjectAdd(project: Project) {
    setProjectOptions(prev => [project, ...prev])
  }

  async function deletePayment(id: string) {
    setDeletingId(id)
    try {
      await apiRequest<{ ok: true }>(`/api/payments/${id}`, { method: 'DELETE' }, 'Failed to delete payment.')
      setPayments((prev) => prev.filter((p) => p.id !== id))
      if (editingPayment?.id === id) setEditingPayment(null)
      toast.success('Payment deleted.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete payment.')
      throw error
    } finally {
      setDeletingId(null)
    }
  }

  async function handleSave(
    values: {
      client_id: string | null
      amount: number
      currency: string
      received_at: string
      notes: string | null
    },
    id: string
  ) {
    const json = await apiRequest<Payment & { error?: string }>(`/api/payments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    }, 'Failed to update payment.')

    setPayments(prev => prev.map(payment => payment.id === id ? json : payment))
    setEditingPayment(json)
    toast.success('Payment updated.')
  }

  async function handleDelete(id: string) {
    const shouldSkipConfirm = typeof window !== 'undefined'
      && window.localStorage.getItem(SKIP_PAYMENT_DELETE_CONFIRM_KEY) === 'true'

    if (shouldSkipConfirm) {
      try {
        await deletePayment(id)
      } catch {}
      return
    }

    const payment = payments.find(item => item.id === id)
    if (payment) setConfirmingDeletePayment(payment)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: 'clamp(22px,2.4vw,26px)', fontWeight: 640, letterSpacing: '-0.045em', color: 'var(--text)' }}>
          Payments
        </h1>
        <button className="add-entry-btn" onClick={() => setShowAddPayment(true)}>
          + Add Payment
        </button>
      </div>
      <PaymentList
        payments={payments}
        clients={clients}
        projects={projectOptions}
        onEdit={setEditingPayment}
        onDelete={handleDelete}
        deletingId={deletingId}
      />
      <AddPaymentModal
        open={showAddPayment}
        onClose={() => setShowAddPayment(false)}
        onAdd={handleAdd}
        onProjectAdd={handleProjectAdd}
        clients={clients}
        projects={projectOptions}
        scheduleEntries={pendingScheduleEntries}
      />
      <EditPaymentModal
        payment={editingPayment}
        clients={clients}
        open={!!editingPayment}
        onClose={() => setEditingPayment(null)}
        onSave={handleSave}
      />
      <ConfirmActionModal
        open={!!confirmingDeletePayment}
        title="Delete payment"
        description={
          confirmingDeletePayment
            ? `Remove the payment logged for ${confirmingDeletePayment.received_at} from your history.`
            : ''
        }
        confirmLabel="Delete payment"
        checkboxLabel="Don't show again"
        onClose={() => setConfirmingDeletePayment(null)}
        onConfirm={async (rememberChoice) => {
          if (!confirmingDeletePayment) return
          if (rememberChoice && typeof window !== 'undefined') {
            window.localStorage.setItem(SKIP_PAYMENT_DELETE_CONFIRM_KEY, 'true')
          }
          try {
            await deletePayment(confirmingDeletePayment.id)
          } catch {
            return
          }
          setConfirmingDeletePayment(null)
        }}
      />
    </div>
  )
}

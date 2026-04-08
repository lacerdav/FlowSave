'use client'

import { useState } from 'react'
import { ConfirmActionModal } from '@/components/shared/ConfirmActionModal'
import { PaymentForm } from './PaymentForm'
import { EditPaymentModal } from './EditPaymentModal'
import { PaymentList } from './PaymentList'
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
    const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPayments((prev) => prev.filter((p) => p.id !== id))
      if (editingPayment?.id === id) setEditingPayment(null)
    }
    setDeletingId(null)
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
    const res = await fetch(`/api/payments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    const json = await res.json().catch(() => ({})) as Payment & { error?: string }
    if (!res.ok) throw new Error(json.error ?? 'Failed to update payment.')

    setPayments(prev => prev.map(payment => payment.id === id ? json : payment))
    setEditingPayment(json)
  }

  async function handleDelete(id: string) {
    const shouldSkipConfirm = typeof window !== 'undefined'
      && window.localStorage.getItem(SKIP_PAYMENT_DELETE_CONFIRM_KEY) === 'true'

    if (shouldSkipConfirm) {
      await deletePayment(id)
      return
    }

    const payment = payments.find(item => item.id === id)
    if (payment) setConfirmingDeletePayment(payment)
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto w-full max-w-[860px]">
        <PaymentForm
          clients={clients}
          projects={projectOptions}
          scheduleEntries={pendingScheduleEntries}
          onAdd={handleAdd}
          onProjectAdd={handleProjectAdd}
        />
      </div>
      <PaymentList
        payments={payments}
        clients={clients}
        projects={projectOptions}
        onEdit={setEditingPayment}
        onDelete={handleDelete}
        deletingId={deletingId}
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
          await deletePayment(confirmingDeletePayment.id)
          setConfirmingDeletePayment(null)
        }}
      />
    </div>
  )
}

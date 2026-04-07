'use client'

import { useState } from 'react'
import { PaymentForm } from './PaymentForm'
import { PaymentList } from './PaymentList'
import type { Client, Payment } from '@/types'

interface Props {
  initialPayments: Payment[]
  clients: Pick<Client, 'id' | 'name' | 'currency'>[]
}

export function PaymentsPageClient({ initialPayments, clients }: Props) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleAdd(payment: Payment) {
    setPayments((prev) => [payment, ...prev])
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPayments((prev) => prev.filter((p) => p.id !== id))
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      <PaymentForm clients={clients} onAdd={handleAdd} />
      <PaymentList
        payments={payments}
        clients={clients}
        onDelete={handleDelete}
        deletingId={deletingId}
      />
    </div>
  )
}

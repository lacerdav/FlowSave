'use client'

import { useState } from 'react'
import { ClientForm } from './ClientForm'
import { ClientList } from './ClientList'
import { UpgradeLimitModal } from './UpgradeLimitModal'
import type { Client } from '@/types'

interface Props {
  initialClients: Client[]
  plan: 'free' | 'pro'
}

export function ClientsPageClient({ initialClients, plan }: Props) {
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  function handleAdd(client: Client) {
    setClients((prev) => [client, ...prev])
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setClients((prev) => prev.filter((c) => c.id !== id))
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      <ClientForm
        onAdd={handleAdd}
        onLimitReached={() => setShowModal(true)}
        plan={plan}
        clientCount={clients.length}
      />

      {plan === 'free' && (
        <p className="text-center text-xs" style={{ color: 'var(--text3)' }}>
          {clients.length}/2 clients used on free plan.
        </p>
      )}

      <ClientList
        clients={clients}
        onDelete={handleDelete}
        deletingId={deletingId}
      />

      <UpgradeLimitModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}

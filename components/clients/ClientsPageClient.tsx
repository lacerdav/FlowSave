'use client'

import { useState } from 'react'
import { ClientForm } from './ClientForm'
import { EditClientModal } from './EditClientModal'
import { ClientList } from './ClientList'
import { UpgradeLimitModal } from './UpgradeLimitModal'
import { ConfirmActionModal } from '@/components/shared/ConfirmActionModal'
import type { Client } from '@/types'

interface Props {
  initialClients: Client[]
  plan: 'free' | 'pro'
}

const SKIP_CLIENT_DELETE_CONFIRM_KEY = 'flowsave-skip-client-delete-confirm'

export function ClientsPageClient({ initialClients, plan }: Props) {
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [confirmingDeleteClient, setConfirmingDeleteClient] = useState<Client | null>(null)

  function handleAdd(client: Client) {
    setClients((prev) => [client, ...prev])
  }

  async function deleteClient(id: string) {
    setDeletingId(id)
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setClients((prev) => prev.filter((c) => c.id !== id))
      if (editingClient?.id === id) setEditingClient(null)
    }
    setDeletingId(null)
  }

  async function handleSave(values: { name: string; currency: string }, id: string) {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    const json = await res.json().catch(() => ({})) as Client & { error?: string }
    if (!res.ok) throw new Error(json.error ?? 'Failed to update client.')

    setClients(prev => prev.map(client => client.id === id ? json : client))
    setEditingClient(json)
  }

  async function handleDelete(id: string) {
    const shouldSkipConfirm = typeof window !== 'undefined'
      && window.localStorage.getItem(SKIP_CLIENT_DELETE_CONFIRM_KEY) === 'true'

    if (shouldSkipConfirm) {
      await deleteClient(id)
      return
    }

    const client = clients.find(item => item.id === id)
    if (client) setConfirmingDeleteClient(client)
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto w-full max-w-[860px]">
        <ClientForm
          onAdd={handleAdd}
          onLimitReached={() => setShowModal(true)}
          plan={plan}
          clientCount={clients.length}
        />
      </div>

      {plan === 'free' && (
        <div className="mx-auto w-full max-w-[860px]">
          <div className="info-banner">
            <div className="space-y-1">
              <p className="info-banner__title">Free plan usage</p>
              <p className="info-banner__copy">
                {clients.length}/2 client slots used on the free plan.
              </p>
            </div>
            <span className="status-chip" data-tone={clients.length >= 2 ? 'amber' : 'neutral'}>
              {clients.length >= 2 ? 'Limit reached' : 'Available'}
            </span>
          </div>
        </div>
      )}

      <ClientList
        clients={clients}
        onEdit={setEditingClient}
        onDelete={handleDelete}
        deletingId={deletingId}
      />

      <UpgradeLimitModal open={showModal} onClose={() => setShowModal(false)} />
      <EditClientModal
        client={editingClient}
        open={!!editingClient}
        onClose={() => setEditingClient(null)}
        onSave={handleSave}
      />
      <ConfirmActionModal
        open={!!confirmingDeleteClient}
        title="Delete client"
        description={
          confirmingDeleteClient
            ? `Remove ${confirmingDeleteClient.name} and its related client record from the dashboard.`
            : ''
        }
        confirmLabel="Delete client"
        checkboxLabel="Don't show again"
        onClose={() => setConfirmingDeleteClient(null)}
        onConfirm={async (rememberChoice) => {
          if (!confirmingDeleteClient) return
          if (rememberChoice && typeof window !== 'undefined') {
            window.localStorage.setItem(SKIP_CLIENT_DELETE_CONFIRM_KEY, 'true')
          }
          await deleteClient(confirmingDeleteClient.id)
          setConfirmingDeleteClient(null)
        }}
      />
    </div>
  )
}

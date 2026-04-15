'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PlusIcon } from 'lucide-react'
import { AddClientModal } from './AddClientModal'
import { EditClientModal } from './EditClientModal'
import { ClientList } from './ClientList'
import { UpgradeLimitModal } from './UpgradeLimitModal'
import { ConfirmActionModal } from '@/components/shared/ConfirmActionModal'
import type { Client } from '@/types'
import type { ClientWithStats } from '@/lib/supabase/queries/clients'

interface Props {
  initialClients: ClientWithStats[]
  plan: 'free' | 'pro'
}

const SKIP_CLIENT_DELETE_CONFIRM_KEY = 'flowsave-skip-client-delete-confirm'
const FREE_CLIENT_LIMIT = 2

export function ClientsPageClient({ initialClients, plan }: Props) {
  const [clients, setClients] = useState<ClientWithStats[]>(initialClients)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientWithStats | null>(null)
  const [confirmingDeleteClient, setConfirmingDeleteClient] = useState<ClientWithStats | null>(null)

  function handleAdd(client: Client) {
    // Prepend with zeroed stats — they'll refresh on next page load
    const withStats: ClientWithStats = {
      ...client,
      total_received: 0,
      last_payment_date: null,
      active_project_count: 0,
    }
    setClients((prev) => [withStats, ...prev])
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

    // Preserve existing stats while updating base fields
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...json } : c))
    setEditingClient(prev => prev?.id === id ? { ...prev, ...json } : prev)
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

  const count = clients.length
  const atLimit = plan === 'free' && count >= FREE_CLIENT_LIMIT

  return (
    <div className="space-y-5">
      {/* Page actions */}
      <div className="flex items-center justify-between gap-4">
        <div />
        <button
          type="button"
          onClick={() => atLimit ? setShowUpgradeModal(true) : setShowAddModal(true)}
          className="surface-action-button interactive flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium"
        >
          <PlusIcon className="h-4 w-4" />
          Add client
        </button>
      </div>

      {/* FREE plan usage banner */}
      {plan === 'free' && (
        <div className={`usage-banner${atLimit ? ' usage-banner--maxed' : ''}`}>
          <div className="usage-banner__content">
            <p className="usage-banner__title">
              {atLimit ? 'Client limit reached' : `${count}/${FREE_CLIENT_LIMIT} clients used`}
            </p>
            <p className="usage-banner__copy">
              {atLimit
                ? 'Upgrade to Pro for unlimited clients, AI insights, and forecasting.'
                : `You can add ${FREE_CLIENT_LIMIT - count} more client${FREE_CLIENT_LIMIT - count === 1 ? '' : 's'} on the free plan.`
              }
            </p>
          </div>
          <div className="usage-banner__right">
            {atLimit ? (
              <Link
                href="/upgrade"
                className="usage-banner__cta"
                onClick={() => {}}
              >
                Upgrade to Pro
              </Link>
            ) : (
              <div className="usage-banner__track">
                <div
                  className="usage-banner__fill"
                  style={{ width: `${(count / FREE_CLIENT_LIMIT) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <ClientList
        clients={clients}
        onEdit={setEditingClient}
        onDelete={handleDelete}
        deletingId={deletingId}
      />

      <AddClientModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAdd}
        onLimitReached={() => { setShowAddModal(false); setShowUpgradeModal(true) }}
        plan={plan}
        clientCount={count}
      />
      <UpgradeLimitModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
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

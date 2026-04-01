'use client'

import { formatDate } from '@/lib/utils'
import type { Client } from '@/types'

interface Props {
  clients: Client[]
  onDelete: (id: string) => void
  deletingId: string | null
}

const CURRENCY_LABELS: Record<string, string> = { USD: 'USD', BRL: 'BRL' }

export function ClientList({ clients, onDelete, deletingId }: Props) {
  if (clients.length === 0) {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text3)' }}>
          No clients yet. Add your first client above.
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border)' }}
    >
      {clients.map((client, i) => (
        <div
          key={client.id}
          className="flex items-center justify-between px-5 py-3.5"
          style={{
            background: 'var(--bg2)',
            borderBottom: i < clients.length - 1 ? '1px solid var(--border)' : undefined,
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: 'var(--accent)' }}
            />
            <span className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
              {client.name}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: 'var(--surface)', color: 'var(--text3)' }}
            >
              {CURRENCY_LABELS[client.currency] ?? client.currency}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs hidden sm:block" style={{ color: 'var(--text3)' }}>
              Added {formatDate(client.created_at.split('T')[0])}
            </span>
            <button
              onClick={() => onDelete(client.id)}
              disabled={deletingId === client.id}
              className="text-xs transition-colors hover:text-[var(--red)]"
              style={{ color: 'var(--text3)' }}
            >
              {deletingId === client.id ? 'Removing…' : 'Remove'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

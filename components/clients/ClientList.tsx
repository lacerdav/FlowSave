'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import type { Client } from '@/types'

interface Props {
  clients: Client[]
  onDelete: (id: string) => void
  deletingId: string | null
}

const CURRENCY_LABELS: Record<string, string> = { USD: 'USD', BRL: 'BRL' }

export function ClientList({ clients, onDelete, deletingId }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (clients.length === 0) {
    return (
      <div
        className="panel-surface rounded-xl p-8 text-center"
        style={{ border: '1px solid var(--border)' }}
      >
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>
          No clients yet. Add your first client above.
        </p>
      </div>
    )
  }

  return (
    <div
      className="panel-surface rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border)' }}
    >
      {clients.map((client, i) => (
        <div
          key={client.id}
          className="row-hover flex items-center justify-between px-5 py-4"
          style={{
            background: hoveredId === client.id ? 'rgba(255, 255, 255, 0.07)' : 'transparent',
            borderBottom: i < clients.length - 1 ? '1px solid var(--border)' : undefined,
          }}
          onMouseEnter={() => setHoveredId(client.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: 'var(--accent)' }}
            />
            <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)' }} className="truncate">
              {client.name}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: 'var(--surface-2)', color: 'var(--text3)', fontSize: 11 }}
            >
              {CURRENCY_LABELS[client.currency] ?? client.currency}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:block" style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.01em' }}>
              Added {formatDate(client.created_at.split('T')[0])}
            </span>
            <button
              onClick={() => onDelete(client.id)}
              disabled={deletingId === client.id}
              className="transition-colors"
              style={{
                fontSize: 12,
                color: hoveredId === client.id ? 'var(--red)' : 'var(--text3)',
                opacity: hoveredId === client.id || deletingId === client.id ? 1 : 0,
                pointerEvents: hoveredId === client.id || deletingId === client.id ? 'auto' : 'none',
                transition: 'color 150ms ease, opacity 150ms ease',
              }}
            >
              {deletingId === client.id ? 'Removing…' : 'Remove'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

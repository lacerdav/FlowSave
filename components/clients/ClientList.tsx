'use client'

import { AnimatePresence, LayoutGroup, m, useReducedMotion } from 'motion/react'
import { formatDate } from '@/lib/utils'
import { ActionMenu } from '@/components/ui/action-menu'
import type { Client } from '@/types'

interface Props {
  clients: Client[]
  onEdit: (client: Client) => void
  onDelete: (id: string) => void
  deletingId: string | null
}

const CURRENCY_LABELS: Record<string, string> = { USD: 'USD', BRL: 'BRL' }
const ease = [0.22, 1, 0.36, 1] as const

export function ClientList({ clients, onEdit, onDelete, deletingId }: Props) {
  const shouldReduceMotion = useReducedMotion()

  if (clients.length === 0) {
    return (
      <div
        className="panel-surface card-interactive rounded-[18px] p-10 text-center"
        style={{ border: '1px solid var(--border)' }}
      >
        <p className="form-card-title text-[24px]">
          No clients yet
        </p>
        <p className="mx-auto mt-3 max-w-md form-card-copy">
          Add your first client above and this page will become a polished roster instead of an empty shell.
        </p>
      </div>
    )
  }

  return (
    <LayoutGroup>
      <div className="entity-grid">
        <AnimatePresence initial={false}>
          {clients.map((client) => (
            <m.div
              key={client.id}
              layout
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.985 }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.22, ease, layout: { duration: 0.24, ease } }}
              whileHover={shouldReduceMotion ? undefined : { y: -2 }}
              className="entity-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      background: 'var(--accent2)',
                      boxShadow: '0 0 10px rgba(124, 150, 255, 0.38)',
                    }}
                  />
                  <span className="entity-card__eyebrow">Client</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="status-chip" data-tone="neutral">
                    {CURRENCY_LABELS[client.currency] ?? client.currency}
                  </span>
                  <ActionMenu
                    label={`Actions for ${client.name}`}

                    items={[
                      { label: 'Edit', onSelect: () => onEdit(client) },
                      {
                        label: deletingId === client.id ? 'Deleting…' : 'Delete',
                        onSelect: () => onDelete(client.id),
                        tone: 'danger',
                        disabled: deletingId === client.id,
                      },
                    ]}
                  />
                </div>
              </div>

              <div className="entity-card__stack">
                <p className="entity-card__title">{client.name}</p>
                <p className="entity-card__subtitle">
                  Projects and payments for this client will default to {CURRENCY_LABELS[client.currency] ?? client.currency}.
                </p>
              </div>

              <div className="entity-card__footer">
                <div className="entity-card__meta">
                  Added {formatDate(client.created_at.split('T')[0])}
                </div>
              </div>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  )
}

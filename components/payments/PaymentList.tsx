'use client'

import { useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Client, Payment } from '@/types'

interface Props {
  payments: Payment[]
  clients: Pick<Client, 'id' | 'name'>[]
  onDelete: (id: string) => void
  deletingId: string | null
}

interface MonthGroup {
  key: string
  label: string
  payments: Payment[]
}

function isFuture(dateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(dateStr + 'T00:00:00')
  return date > today
}

function groupByMonth(payments: Payment[]): MonthGroup[] {
  const groupsMap = new Map<string, MonthGroup>()
  const sortedPayments = [...payments].sort(
    (a, b) =>
      new Date(b.received_at + 'T00:00:00').getTime() -
      new Date(a.received_at + 'T00:00:00').getTime()
  )

  for (const p of sortedPayments) {
    const date = new Date(p.received_at + 'T00:00:00')
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })

    const existing = groupsMap.get(key)
    if (existing) {
      existing.payments.push(p)
    } else {
      groupsMap.set(key, { key, label, payments: [p] })
    }
  }

  return Array.from(groupsMap.values()).sort((a, b) => b.key.localeCompare(a.key))
}

export function PaymentList({ payments, clients, onDelete, deletingId }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const clientMap = new Map(clients.map((c) => [c.id, c.name]))

  if (payments.length === 0) {
    return (
      <div
        className="panel-surface rounded-xl p-8 text-center"
        style={{ border: '1px solid var(--border)' }}
      >
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>
          No payments logged yet. Add your first payment above.
        </p>
      </div>
    )
  }

  const groups = groupByMonth(payments)

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.key}>
          {/* Month header */}
          <p
            className="mb-2 px-1 text-[10px] font-semibold tracking-[0.16em] uppercase"
            style={{ color: 'var(--text3)' }}
          >
            {group.label}
          </p>

          <div
            className="panel-surface rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border)' }}
          >
            {group.payments.map((payment, i) => {
              const clientName = payment.client_id
                ? (clientMap.get(payment.client_id) ?? 'Unknown client')
                : 'No client'
              const isLast = i === group.payments.length - 1
              const isHovered = hoveredId === payment.id
              const future = isFuture(payment.received_at)

              return (
                <div
                  key={payment.id}
                  className="row-hover flex items-center justify-between px-5 py-4"
                  style={{
                    background: isHovered
                      ? 'linear-gradient(180deg, rgba(19, 27, 56, 0.6) 0%, rgba(13, 18, 41, 0.44) 100%)'
                      : 'transparent',
                    boxShadow: isHovered
                      ? 'inset 0 0 0 1px rgba(126, 151, 255, 0.08)'
                      : undefined,
                    borderBottom: !isLast ? '1px solid var(--border)' : undefined,
                  }}
                  onMouseEnter={() => setHoveredId(payment.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: 'var(--green)' }}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium" style={{ fontSize: '13.5px', color: 'var(--text)' }}>
                        {clientName}
                      </p>
                      {payment.notes && (
                        <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--text3)' }}>
                          {payment.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                    <span className="text-sm font-semibold tabular-nums" style={{ color: future ? 'var(--accent2)' : 'var(--green)' }}>
                      {formatCurrency(payment.amount, payment.currency)}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text3)', letterSpacing: '0.01em' }}>
                      {formatDate(payment.received_at)}
                    </span>
                    <button
                      onClick={() => onDelete(payment.id)}
                      disabled={deletingId === payment.id}
                      className="text-xs transition-all"
                      style={{
                        color: 'var(--red)',
                        opacity: isHovered || deletingId === payment.id ? 1 : 0,
                        pointerEvents: isHovered || deletingId === payment.id ? 'auto' : 'none',
                      }}
                    >
                      {deletingId === payment.id ? 'Removing…' : 'Remove'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

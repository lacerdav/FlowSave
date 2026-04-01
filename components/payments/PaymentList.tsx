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
  const groups: MonthGroup[] = []
  let current: MonthGroup | null = null
  for (const p of payments) {
    const label = new Date(p.received_at + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
    if (!current || current.label !== label) {
      current = { label, payments: [] }
      groups.push(current)
    }
    current.payments.push(p)
  }
  return groups
}

export function PaymentList({ payments, clients, onDelete, deletingId }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const clientMap = new Map(clients.map((c) => [c.id, c.name]))

  if (payments.length === 0) {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text3)' }}>
          No payments logged yet. Add your first payment above.
        </p>
      </div>
    )
  }

  const groups = groupByMonth(payments)

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.label}>
          {/* Month header */}
          <p
            className="mb-2 px-1 text-xs font-medium tracking-widest uppercase"
            style={{ color: 'var(--text3)' }}
          >
            {group.label}
          </p>

          <div
            className="rounded-xl overflow-hidden"
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
                  className="flex items-center justify-between px-5 py-3.5"
                  style={{
                    background: 'var(--bg2)',
                    borderBottom: !isLast ? '1px solid var(--border)' : undefined,
                  }}
                  onMouseEnter={() => setHoveredId(payment.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Left: dot + client name + optional notes */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: 'var(--green)' }}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium" style={{ fontSize: '14px', color: 'var(--text)' }}>
                        {clientName}
                      </p>
                      {payment.notes && (
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text3)' }}>
                          {payment.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: amount + date + remove */}
                  <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                    <span className="text-sm font-semibold tabular-nums" style={{ color: future ? 'var(--accent2)' : 'var(--green)' }}>
                      {formatCurrency(payment.amount, payment.currency)}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text2)' }}>
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

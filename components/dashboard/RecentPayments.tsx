'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ReceiptIcon } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export interface PaymentItem {
  id: string
  clientName: string
  clientColor: string
  amount: number
  currency: string
  receivedAt: string
  isPast: boolean
}

interface RecentPaymentsProps {
  payments: PaymentItem[]
}

export function RecentPayments({ payments }: RecentPaymentsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div
      className="recent-payments-card card-interactive rounded-xl p-4 flex flex-col"
    >
      <div className="mb-3">
        <div className="flex items-center justify-center gap-1.5">
          <ReceiptIcon size={13} style={{ color: 'rgba(34,216,122,0.65)', strokeWidth: 2.2, flexShrink: 0 }} />
          <p className="metric-card__label">Recent Payments</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>No payments yet</p>
          <Link
            href="/payments"
            style={{ fontSize: 12, color: 'var(--accent2)' }}
          >
            Log your first payment →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {payments.map((p, i) => (
            <div
              key={p.id}
              className="row-hover recent-payment-row flex items-center gap-3 py-2.5 px-2 rounded-xl -mx-2"
              style={{
                borderBottom:
                  i < payments.length - 1 ? '1px solid var(--border)' : 'none',
              }}
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: p.clientColor }}
              />

              <span
                className="flex-1 truncate"
                style={{
                  fontSize: 14.5,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  color: hoveredId === p.id ? '#f8f9ff' : 'var(--text)',
                  transition: 'color 120ms ease',
                }}
              >
                {p.clientName}
              </span>

              <span
                className={p.isPast ? 'metric-value--green' : 'metric-value--blue'}
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: p.isPast ? 'var(--green)' : 'var(--accent2)',
                  letterSpacing: '-0.025em',
                }}
              >
                {formatCurrency(p.amount, p.currency)}
              </span>

              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text3)',
                  minWidth: 44,
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {formatDate(p.receivedAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
  return (
    <div
      className="rounded-xl p-5 flex flex-col"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        minHeight: 260,
      }}
    >
      <p className="section-label mb-4">Recent Payments</p>

      {payments.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>No payments yet</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {payments.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center gap-3 py-2.5"
              style={{
                borderBottom:
                  i < payments.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              {/* Client color dot */}
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: p.clientColor }}
              />

              {/* Client name */}
              <span
                className="flex-1 truncate"
                style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}
              >
                {p.clientName}
              </span>

              {/* Amount */}
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: p.isPast ? 'var(--green)' : 'var(--accent2)',
                }}
              >
                {formatCurrency(p.amount, p.currency)}
              </span>

              {/* Date */}
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text3)',
                  minWidth: 56,
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

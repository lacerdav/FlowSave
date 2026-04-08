import { formatCurrency } from '@/lib/utils'

export interface TaxReserveItem {
  id: string
  clientName: string
  amountReceived: number
  reserveAmount: number
  currency: string
}

interface TaxReserveCardProps {
  items: TaxReserveItem[]
  taxPct: number
}

export function TaxReserveCard({ items, taxPct }: TaxReserveCardProps) {
  const totalsByCurrency = items.reduce((map, item) => {
    map.set(item.currency, (map.get(item.currency) ?? 0) + item.reserveAmount)
    return map
  }, new Map<string, number>())

  const totalReserveLabel = Array.from(totalsByCurrency.entries())
    .map(([itemCurrency, total]) => formatCurrency(Math.round(total * 100) / 100, itemCurrency))
    .join(' + ')

  return (
    <div
      className="panel-surface card-interactive rounded-xl p-4"
      style={{
        border: '1px solid var(--border)',
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="metric-card__label">Tax Reserve</p>
          <h2 className="dashboard-card-title">Protected for taxes</h2>
          <p className="dashboard-card-copy">Set aside {taxPct}% from each payment.</p>
        </div>
        <span
          style={{
            fontSize: 11,
            color: 'var(--text3)',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '2px 8px',
          }}
        >
          {taxPct}% rate
        </span>
      </div>

      {items.length === 0 ? (
        <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6 }}>
          No payments logged this month.
          <br />
          <span style={{ fontSize: 12 }}>Reserve will appear here once you log income.</span>
        </p>
      ) : (
        <>
          <div className="flex flex-col">
            {items.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2"
                style={{
                  borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div className="flex flex-col gap-0.5">
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                    {item.clientName}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {formatCurrency(item.amountReceived, item.currency)} received
                  </span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--amber)', letterSpacing: '-0.2px' }}>
                  {formatCurrency(item.reserveAmount, item.currency)}
                </span>
              </div>
            ))}
          </div>

          <div
            className="mt-1 flex items-center justify-between pt-3"
            style={{ borderTop: '1px solid var(--border-strong)' }}
          >
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>
              Total reserve this month
            </span>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--green)', letterSpacing: '-0.3px' }}>
              {totalReserveLabel}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

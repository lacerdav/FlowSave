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

export function TaxReserveCard({
  items,
  taxPct,
}: TaxReserveCardProps) {
  const totalsByCurrency = items.reduce((map, item) => {
    map.set(item.currency, (map.get(item.currency) ?? 0) + item.reserveAmount)
    return map
  }, new Map<string, number>())

  const totalReserveLabel = Array.from(totalsByCurrency.entries())
    .map(([itemCurrency, total]) => {
      const roundedTotal = Math.round(total * 100) / 100
      return formatCurrency(roundedTotal, itemCurrency)
    })
    .join(' + ')

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="section-label">Tax Reserve</p>
        <span className="text-xs" style={{ color: 'var(--text3)' }}>
          {taxPct}% rate
        </span>
      </div>

      {items.length === 0 ? (
        <p style={{ color: 'var(--text3)', fontSize: 13 }}>
          No payments logged this month
        </p>
      ) : (
        <>
          <div className="flex flex-col">
            {items.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2.5"
                style={{
                  borderBottom:
                    i < items.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div className="flex flex-col gap-0.5">
                  <span
                    style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}
                  >
                    {item.clientName}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {formatCurrency(item.amountReceived, item.currency)} received
                  </span>
                </div>
                <span
                  style={{ fontSize: 13, fontWeight: 500, color: 'var(--amber)' }}
                >
                  {formatCurrency(item.reserveAmount, item.currency)}
                </span>
              </div>
            ))}
          </div>

          <div
            className="flex items-center justify-between pt-3 mt-1"
            style={{ borderTop: '1px solid var(--border-strong)' }}
          >
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>
              Total reserve this month
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--green)' }}>
              {totalReserveLabel}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

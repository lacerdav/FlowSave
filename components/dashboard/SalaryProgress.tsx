import { formatCurrency } from '@/lib/utils'

interface SalaryProgressProps {
  received: number
  target: number
  currency?: string
}

export function SalaryProgress({ received, target, currency = 'USD' }: SalaryProgressProps) {
  const pct = target > 0 ? Math.min((received / target) * 100, 100) : 0
  const isExceeded = target > 0 && received >= target
  const isTargetZero = target === 0

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <p className="section-label mb-4">Salary Target</p>

      <div className="flex items-end justify-between mb-3">
        <span className="metric-value" style={{ color: 'var(--text)' }}>
          {formatCurrency(received, currency)}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
          of {formatCurrency(target, currency)}
        </span>
      </div>

      {/* Track */}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: 6, background: 'var(--border)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: isTargetZero ? '0%' : `${pct}%`,
            background: isExceeded ? 'var(--green)' : 'var(--accent)',
          }}
        />
      </div>

      {/* Label */}
      <p
        className="text-xs mt-2"
        style={{ color: isExceeded ? 'var(--green)' : 'var(--text3)' }}
      >
        {isTargetZero
          ? 'Set a monthly target in Settings'
          : isExceeded
          ? 'Target exceeded'
          : `${Math.round(pct)}% of target`}
      </p>
    </div>
  )
}

import { formatCurrency } from '@/lib/utils'

interface SalaryProgressProps {
  received: number
  target: number
  currency?: string
}

function stateLabel(pct: number, isExceeded: boolean, isTargetZero: boolean): string {
  if (isTargetZero) return 'Set a monthly target in Settings'
  if (isExceeded)   return 'Target exceeded'
  if (pct >= 75)    return 'Almost there'
  if (pct >= 50)    return 'On track'
  if (pct >= 25)    return 'Getting started'
  return 'Early in the month'
}

function stateColor(pct: number, isExceeded: boolean, isTargetZero: boolean): string {
  if (isTargetZero) return 'var(--text3)'
  if (isExceeded)   return 'var(--green)'
  if (pct >= 50)    return 'var(--accent2)'
  return 'var(--text3)'
}

export function SalaryProgress({ received, target, currency = 'USD' }: SalaryProgressProps) {
  const pct = target > 0 ? Math.min((received / target) * 100, 100) : 0
  const isExceeded  = target > 0 && received >= target
  const isTargetZero = target === 0

  const barColor = isExceeded
    ? 'var(--green)'
    : pct >= 50
    ? 'var(--accent)'
    : 'rgba(91,127,255,0.55)'

  return (
    <div
      className="panel-surface card-interactive rounded-xl p-6 flex flex-col gap-4"
      style={{
        border: '1px solid var(--border)',
      }}
    >
      <p className="card-label">Salary Target</p>

      <div className="flex items-end justify-between">
        <span className="metric-value" style={{ color: 'var(--text)', lineHeight: 1 }}>
          {formatCurrency(received, currency)}
        </span>
        {!isTargetZero && (
          <span style={{ fontSize: 12, color: 'var(--text3)', paddingBottom: 2 }}>
            of {formatCurrency(target, currency)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 6, background: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: isTargetZero ? '0%' : `${pct}%`,
              background: barColor,
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span
            style={{
              fontSize: 12,
              color: stateColor(pct, isExceeded, isTargetZero),
              fontWeight: isExceeded ? 500 : 400,
            }}
          >
            {stateLabel(pct, isExceeded, isTargetZero)}
          </span>
          {!isTargetZero && (
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>
              {Math.round(pct)}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

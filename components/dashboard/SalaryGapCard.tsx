import { TargetIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface SalaryGapCardProps {
  gap: number
  target: number
  received: number
  currency: string
}

export function SalaryGapCard({ gap, target, received, currency }: SalaryGapCardProps) {
  const isSurplus = gap <= 0
  const isTargetZero = target === 0
  const displayValue = isSurplus
    ? `+${formatCurrency(Math.abs(gap), currency)}`
    : formatCurrency(gap, currency)

  const color = isSurplus ? 'var(--green)' : 'var(--red)'
  const glowClass = isSurplus ? 'metric-value--green' : 'metric-value--red'
  const label = isSurplus ? 'Surplus' : 'Salary Gap'
  const subtitle = isSurplus
    ? 'Target exceeded this month'
    : target > 0
    ? `of ${formatCurrency(target, currency)} target`
    : 'Set a target in Settings'

  const pct = isTargetZero ? 0 : Math.min((received / target) * 100, 100)
  const barColor = isSurplus
    ? 'var(--green)'
    : pct >= 50
    ? 'var(--accent)'
    : 'rgba(91,127,255,0.45)'

  return (
    <div
      className="salary-gap-card panel-surface card-interactive rounded-xl flex flex-col items-center justify-center gap-2.5 p-5 text-center"
      data-surplus={isSurplus ? 'true' : undefined}
      data-deficit={!isSurplus ? 'true' : undefined}
      style={{
        border: isSurplus
          ? '1px solid rgba(34, 216, 122, 0.18)'
          : '1px solid rgba(255, 91, 127, 0.22)',
      }}
    >
      <div className="flex items-center justify-center gap-1.5">
        <TargetIcon size={13} style={{ color: isSurplus ? 'rgba(34,216,122,0.65)' : 'rgba(255,91,127,0.65)', strokeWidth: 2.2, flexShrink: 0 }} />
        <span className="metric-card__label">{label}</span>
      </div>
      <span
        className={`metric-value ${glowClass}`}
        style={{
          color,
          fontSize: 'clamp(28px, 3.2vw, 38px)',
          letterSpacing: '-0.07em',
          lineHeight: 1,
        }}
      >
        {displayValue}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text3)' }}>{subtitle}</span>

      {/* Progress bar — how much of target has been received */}
      {!isTargetZero && (
        <div className="w-full mt-1" style={{ maxWidth: 160 }}>
          <div
            className="w-full rounded-full"
            style={{ height: 4, background: 'rgba(255,255,255,0.06)', position: 'relative' }}
          >
            <div
              className="rounded-full transition-all duration-700"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${pct}%`,
                background: barColor,
                boxShadow: isSurplus
                  ? '0 0 8px 3px rgba(34, 216, 122, 0.90), 0 0 20px rgba(34, 216, 122, 0.50)'
                  : pct >= 50
                  ? '0 0 8px 3px rgba(91, 127, 255, 0.85), 0 0 20px rgba(91, 127, 255, 0.45)'
                  : '0 0 6px 2px rgba(91, 127, 255, 0.65), 0 0 14px rgba(91, 127, 255, 0.30)',
              }}
            />
          </div>
          <p style={{ fontSize: 10.5, color: 'var(--text3)', marginTop: 5 }}>
            {Math.round(pct)}% of target received
          </p>
        </div>
      )}
    </div>
  )
}

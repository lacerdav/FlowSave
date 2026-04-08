import { formatCurrency } from '@/lib/utils'

interface SalaryGapCardProps {
  gap: number
  target: number
  currency: string
}

export function SalaryGapCard({ gap, target, currency }: SalaryGapCardProps) {
  const isSurplus = gap <= 0
  const displayValue = isSurplus
    ? `+${formatCurrency(Math.abs(gap), currency)}`
    : formatCurrency(gap, currency)

  const color = isSurplus ? 'var(--green)' : 'var(--red)'
  const glowClass = isSurplus ? 'metric-value--green' : 'metric-value--red'
  const label = isSurplus ? 'Surplus' : 'Salary Gap'
  const subtitle = isSurplus
    ? 'Target exceeded this month'
    : target > 0
    ? `${formatCurrency(target, currency)} monthly target`
    : 'Set a target in Settings'

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
      <span className="metric-card__label">{label}</span>
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
    </div>
  )
}

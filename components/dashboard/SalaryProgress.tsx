interface SalaryProgressProps {
  pct: number
  isSurplus: boolean
}

export function SalaryProgress({ pct, isSurplus }: SalaryProgressProps) {
  const barColor = isSurplus
    ? 'var(--green)'
    : pct >= 50
    ? 'var(--accent)'
    : 'rgba(91,127,255,0.45)'

  const glow = isSurplus
    ? '0 0 8px 3px rgba(34, 216, 122, 0.90), 0 0 20px rgba(34, 216, 122, 0.50)'
    : pct >= 50
    ? '0 0 8px 3px rgba(91, 127, 255, 0.85), 0 0 20px rgba(91, 127, 255, 0.45)'
    : '0 0 6px 2px rgba(91, 127, 255, 0.65), 0 0 14px rgba(91, 127, 255, 0.30)'

  return (
    <div className="salary-progress">
      <div className="salary-progress__track">
        <div
          className="salary-progress__fill"
          style={{ width: `${pct}%`, background: barColor, boxShadow: glow }}
        />
      </div>
      <p className="salary-progress__label">{Math.round(pct)}% of target received</p>
    </div>
  )
}

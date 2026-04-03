interface MetricCardProps {
  label: string
  value: string
  valueColor?: string
  subtitle?: string
  subtitleColor?: string
}

export function MetricCard({ label, value, valueColor, subtitle, subtitleColor }: MetricCardProps) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <span className="section-label">{label}</span>
      <span
        className="metric-value"
        style={{ color: valueColor ?? 'var(--text)' }}
      >
        {value}
      </span>
      {subtitle && (
        <span
          className="text-xs"
          style={{ color: subtitleColor ?? 'var(--text3)' }}
        >
          {subtitle}
        </span>
      )}
    </div>
  )
}

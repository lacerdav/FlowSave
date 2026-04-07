interface MetricCardProps {
  label: string
  value: string
  valueColor?: string
  subtitle?: string
  subtitleColor?: string
  /** When true, renders a designed empty state instead of the value */
  isEmpty?: boolean
  emptyMessage?: string
  /** Optional node rendered below the empty message (e.g. a link) */
  emptyAction?: React.ReactNode
  className?: string
}

/** Maps a semantic CSS color var to the appropriate metric-value glow class */
function valueGlowClass(color: string | undefined): string {
  if (!color) return ''
  if (color.includes('--green'))  return 'metric-value--green'
  if (color.includes('--accent')) return 'metric-value--blue'
  if (color.includes('--amber'))  return 'metric-value--amber'
  if (color.includes('--red'))    return 'metric-value--red'
  return ''
}

export function MetricCard({
  label,
  value,
  valueColor,
  subtitle,
  subtitleColor,
  isEmpty,
  emptyMessage,
  emptyAction,
  className = '',
}: MetricCardProps) {
  const glowClass = valueGlowClass(valueColor)

  return (
    <div
      className={`panel-surface card-interactive rounded-xl p-5 flex flex-col gap-3 ${className}`}
      style={{
        border: '1px solid var(--border)',
      }}
    >
      <span className="card-label">{label}</span>

      {isEmpty ? (
        <div className="flex flex-col gap-1.5">
          <span style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.5 }}>
            {emptyMessage ?? 'Nothing here yet'}
          </span>
          {emptyAction && (
            <span className="small-label" style={{ color: 'var(--accent2)' }}>
              {emptyAction}
            </span>
          )}
        </div>
      ) : (
        <>
          <span
            className={`metric-value ${glowClass}`}
            style={{ color: valueColor ?? 'var(--text)', lineHeight: 1.1 }}
          >
            {value}
          </span>
          {subtitle && (
            <span
              className="card-subtitle"
              style={{ color: subtitleColor ?? 'var(--text2)' }}
            >
              {subtitle}
            </span>
          )}
        </>
      )}
    </div>
  )
}

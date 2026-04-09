import Link from 'next/link'
import { TrendingUpIcon } from 'lucide-react'

interface HeroMonthCardProps {
  value: string
  badge?: string
  badgeTone?: 'positive' | 'negative' | 'neutral'
  subtitle?: string
  taxLabel: string
  taxPct: number
}

export function HeroMonthCard({
  value,
  badge,
  badgeTone = 'neutral',
  subtitle,
  taxLabel,
  taxPct,
}: HeroMonthCardProps) {
  return (
    <div className="hero-month-card card-interactive rounded-2xl flex flex-col overflow-hidden">
      {/* Top — This Month */}
      <div className="px-5 pt-5 pb-4 flex flex-col flex-1">
        <div className="flex items-center justify-center gap-1.5">
          <TrendingUpIcon size={13} style={{ color: 'rgba(34,216,122,0.65)', strokeWidth: 2.2, flexShrink: 0 }} />
          <span className="metric-card__label">This Month</span>
        </div>

        <span
          className="hero-month-card__value block mt-3"
          style={{ color: 'var(--green)', textShadow: '0 0 40px rgba(34,216,122,0.28), 0 0 20px rgba(34,216,122,0.16)' }}
        >
          {value}
        </span>

        {badge && (
          <span className="metric-card__badge mt-1.5" data-tone={badgeTone}>
            {badge}
          </span>
        )}

        {subtitle && (
          <p className="card-subtitle mt-1.5" style={{ color: 'var(--text2)' }}>
            {subtitle}
          </p>
        )}

        <Link href="/payments" className="hero-month-card__cta mt-4">
          View cash flow →
        </Link>
      </div>

      {/* Divider */}
      <div className="hero-month-card__divider" />

      {/* Bottom — Tax Reserve integrated */}
      <div className="px-5 py-3.5 flex items-center justify-between gap-3">
        <div>
          <p className="metric-card__label">Tax Reserve</p>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
            {taxPct}% of received
          </p>
        </div>
        <span
          className="metric-value--amber"
          style={{
            fontSize: 'clamp(16px, 1.8vw, 19px)',
            fontWeight: 640,
            letterSpacing: '-0.04em',
            color: 'var(--amber)',
          }}
        >
          {taxLabel}
        </span>
      </div>
    </div>
  )
}

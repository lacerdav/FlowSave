'use client'

import { useRouter } from 'next/navigation'
import { type KeyboardEvent } from 'react'
import { CalendarClockIcon } from 'lucide-react'
import { formatMoneyInputValue } from '@/lib/utils'

interface PendingCardProps {
  thisMonthUsdAmount: number
  thisMonthBrlAmount: number
  usdAmount: number
  brlAmount: number
  pendingCount: number
  subtitle?: string
}

export function PendingCard({
  thisMonthUsdAmount,
  thisMonthBrlAmount,
  usdAmount,
  brlAmount,
  pendingCount,
  subtitle,
}: PendingCardProps) {
  const router = useRouter()

  function openUpcoming() {
    router.push('/upcoming')
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openUpcoming()
    }
  }

  const hasThisMonth = thisMonthUsdAmount > 0 || thisMonthBrlAmount > 0
  const hasTotal = usdAmount > 0 || brlAmount > 0

  const thisMonthUsdStr = formatMoneyInputValue(thisMonthUsdAmount, 'USD')
  const thisMonthBrlStr = formatMoneyInputValue(thisMonthBrlAmount, 'BRL')
  const totalUsdStr = formatMoneyInputValue(usdAmount, 'USD')
  const totalBrlStr = formatMoneyInputValue(brlAmount, 'BRL')

  return (
    <div
      className="pending-card card-interactive rounded-xl flex flex-col overflow-hidden"
      role="link"
      tabIndex={0}
      onClick={openUpcoming}
      onKeyDown={handleCardKeyDown}
    >
      {/* ── Top section ── */}
      <div className="px-5 pt-5 pb-4 flex flex-col flex-1 gap-3">
        <div className="flex items-center justify-center gap-1.5">
          <CalendarClockIcon size={13} style={{ color: 'rgba(124,150,255,0.70)', strokeWidth: 2.2, flexShrink: 0 }} />
          <span className="metric-card__label">Pending</span>
        </div>

        {hasThisMonth ? (
          <div className="flex flex-col gap-0.5">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
              <span className="pending-card__currency-value">
                <span className="pending-card__currency-symbol">$</span>
                {thisMonthUsdStr}
              </span>
              <span className="pending-card__currency-divider hidden sm:inline-block" aria-hidden="true" />
              <span className="pending-card__currency-value">
                <span className="pending-card__currency-symbol">R$</span>
                {thisMonthBrlStr}
              </span>
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 2 }}>
              Expected this month
            </p>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
            Nothing scheduled this month
          </p>
        )}

        <span className="pending-card__cta mt-auto">View schedule →</span>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginInline: '1.25rem', flexShrink: 0 }} />

      {/* ── Bottom section — total pipeline ── */}
      <div className="px-5 py-3.5 flex items-center justify-between gap-3">
        <div>
          <p className="metric-card__label">Total pipeline</p>
          {subtitle && (
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{subtitle}</p>
          )}
        </div>
        {hasTotal ? (
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(124,150,255,0.60)', letterSpacing: '-0.02em', textAlign: 'right' }}>
            {usdAmount > 0 && `$${totalUsdStr}`}
            {usdAmount > 0 && brlAmount > 0 && ' · '}
            {brlAmount > 0 && `R$${totalBrlStr}`}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>—</span>
        )}
      </div>
    </div>
  )
}

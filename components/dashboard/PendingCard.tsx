'use client'

import { useRouter } from 'next/navigation'
import { type KeyboardEvent } from 'react'
import { formatMoneyInputValue } from '@/lib/utils'

interface PendingCardProps {
  usdAmount: number
  brlAmount: number
  pendingCount: number
  subtitle?: string
}

export function PendingCard({
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

  const hasData = pendingCount > 0

  const usdNumber = formatMoneyInputValue(usdAmount, 'USD') // "1,234.56"
  const brlNumber = formatMoneyInputValue(brlAmount, 'BRL') // "1.234,56"

  return (
    <div
      className="pending-card card-interactive rounded-xl p-5 flex flex-col gap-3"
      role="link"
      tabIndex={0}
      onClick={openUpcoming}
      onKeyDown={handleCardKeyDown}
    >
      <span className="metric-card__label">Pending</span>

      {hasData ? (
        <>
          {/* Horizontal layout: stacks on mobile, side-by-side on sm+ */}
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
            <span className="pending-card__currency-value">
              <span className="pending-card__currency-symbol">$</span>
              {usdNumber}
            </span>

            {/* Vertical divider — hidden on mobile to keep stacked look clean */}
            <span className="pending-card__currency-divider hidden sm:inline-block" aria-hidden="true" />

            <span className="pending-card__currency-value">
              <span className="pending-card__currency-symbol">R$</span>
              {brlNumber}
            </span>
          </div>

          {subtitle && (
            <p className="pending-card__summary-line">{subtitle}</p>
          )}
        </>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
          No upcoming payments
        </p>
      )}

      <span className="pending-card__cta mt-auto">View schedule →</span>
    </div>
  )
}

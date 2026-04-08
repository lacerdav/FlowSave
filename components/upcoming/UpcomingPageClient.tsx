'use client'

import { useState } from 'react'
import { m, AnimatePresence, useReducedMotion } from 'framer-motion'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ActionMenu } from '@/components/ui/action-menu'
import { MarkScheduleReceivedModal } from './MarkScheduleReceivedModal'
import type { PaymentCreateResponse, ScheduleEntryStatus } from '@/types'

export interface EnrichedEntry {
  id: string
  projectId: string
  projectName: string
  clientName: string | null
  amount: number
  currency: string
  expectedDate: string
  status: ScheduleEntryStatus
  label: string | null
  paymentId: string | null
}

export interface MonthGroup {
  key: string       // YYYY-MM
  monthLabel: string
  totalByCurrency: Record<string, number>
  entries: EnrichedEntry[]
}

interface Props {
  groups: MonthGroup[]
}

const ease = [0.22, 1, 0.36, 1] as const

function StatusBadge({ status }: { status: ScheduleEntryStatus }) {
  const config = {
    scheduled: {
      label: 'Scheduled',
      color: 'var(--accent2)',
      bg: 'rgba(91,127,255,0.12)',
      border: 'rgba(124,150,255,0.24)',
    },
    received: {
      label: 'Received',
      color: 'var(--green)',
      bg: 'rgba(34,216,122,0.12)',
      border: 'rgba(34,216,122,0.28)',
    },
    cancelled: {
      label: 'Cancelled',
      color: 'var(--text3)',
      bg: 'rgba(255,255,255,0.04)',
      border: 'rgba(255,255,255,0.08)',
    },
  }[status]

  return (
    <span
      className="rounded-md px-2 py-[3px] text-[10.5px] font-medium tracking-wide whitespace-nowrap"
      style={{
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        letterSpacing: '0.05em',
      }}
    >
      {config.label}
    </span>
  )
}

function multiCurrencyLabel(totals: Record<string, number>): string {
  return Object.entries(totals)
    .map(([cur, amt]) => formatCurrency(Math.round(amt * 100) / 100, cur))
    .join(' + ')
}

export function UpcomingPageClient({ groups: initialGroups }: Props) {
  const shouldReduceMotion = useReducedMotion()
  const [groups, setGroups] = useState<MonthGroup[]>(initialGroups)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [receivingEntry, setReceivingEntry] = useState<EnrichedEntry | null>(null)

  async function handleCancel(entry: EnrichedEntry) {
    setCancelling(entry.id)
    const res = await fetch(`/api/schedule/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    if (res.ok) {
      setGroups(prev =>
        prev.map(g => ({
          ...g,
          entries: g.entries.map(e =>
            e.id === entry.id ? { ...e, status: 'cancelled' as const } : e
          ),
          totalByCurrency: recalcTotals(
            g.entries.map(e =>
              e.id === entry.id ? { ...e, status: 'cancelled' as const } : e
            )
          ),
        }))
      )
    }
    setCancelling(null)
  }

  function handleMarkReceived(result: PaymentCreateResponse) {
    if (!receivingEntry || !result.linked_schedule_entry_id) return

    setGroups(prev =>
      prev.map(group => {
        const entries = group.entries.map(entry =>
          entry.id === result.linked_schedule_entry_id
            ? {
                ...entry,
                status: 'received' as const,
                paymentId: result.payment.id,
              }
            : entry
        )

        return {
          ...group,
          entries,
          totalByCurrency: recalcTotals(entries),
        }
      })
    )
  }

  async function handleDelete(entry: EnrichedEntry) {
    const res = await fetch(`/api/schedule/${entry.id}`, { method: 'DELETE' })
    if (res.ok) {
      setGroups(prev =>
        prev
          .map(g => {
            const entries = g.entries.filter(e => e.id !== entry.id)
            return { ...g, entries, totalByCurrency: recalcTotals(entries) }
          })
          .filter(g => g.entries.length > 0)
      )
    }
  }

  if (groups.length === 0) {
    return (
      <div
        className="panel-surface rounded-xl p-12 text-center"
        style={{ border: '1px solid var(--border)' }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--text2)' }}>
          No upcoming payments scheduled
        </p>
        <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--text3)' }}>
          Go to Projects → confirm a project → set up a payment plan.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AnimatePresence initial={false}>
        {groups.map(group => (
          <m.section
            key={group.key}
            layout
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.22, ease }}
          >
            {/* Month heading */}
            <div className="mb-2 flex items-baseline justify-between px-1">
              <p className="list-section-heading">{group.monthLabel}</p>
              <span className="text-xs tabular-nums font-medium" style={{ color: 'var(--accent2)' }}>
                {multiCurrencyLabel(group.totalByCurrency)}
              </span>
            </div>

            {/* Entry list */}
            <div
              className="panel-surface rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(124,150,255,0.14)' }}
            >
              <AnimatePresence initial={false}>
                {group.entries.map((entry, index) => {
                  const isHovered = hoveredId === entry.id
                  const isCancelling = cancelling === entry.id
                  const actionItems =
                    entry.status === 'scheduled'
                      ? [
                          {
                            label: 'Mark received',
                            onSelect: () => setReceivingEntry(entry),
                            tone: 'success' as const,
                          },
                          {
                            label: isCancelling ? 'Cancelling…' : 'Cancel',
                            onSelect: () => handleCancel(entry),
                            tone: 'warning' as const,
                            disabled: isCancelling,
                          },
                        ]
                      : !entry.paymentId
                      ? [
                          {
                            label: 'Delete',
                            onSelect: () => handleDelete(entry),
                            tone: 'danger' as const,
                          },
                        ]
                      : []

                  return (
                    <m.div
                      key={entry.id}
                      layout
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease }}
                      className="flex items-center gap-3 px-5 py-4 transition-colors"
                      style={{
                        background: isHovered
                          ? 'linear-gradient(90deg, rgba(25,36,72,0.64) 0%, rgba(14,20,46,0.44) 100%)'
                          : 'transparent',
                        boxShadow: isHovered
                          ? 'inset 3px 0 0 rgba(91,127,255,0.40), inset 0 0 0 1px rgba(130,158,255,0.09)'
                          : undefined,
                        borderBottom: index !== group.entries.length - 1 ? '1px solid var(--border)' : undefined,
                        opacity: isCancelling ? 0.6 : 1,
                      }}
                      onMouseEnter={() => setHoveredId(entry.id)}
                      onMouseLeave={() => setHoveredId(curr => curr === entry.id ? null : curr)}
                    >
                      {/* Project name + client */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" style={{ color: 'var(--text)' }}>
                          {entry.projectName}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2">
                          {entry.clientName && (
                            <span className="text-[11.5px]" style={{ color: 'var(--text2)' }}>
                              {entry.clientName}
                            </span>
                          )}
                          {entry.label && (
                            <>
                              {entry.clientName && (
                                <span style={{ color: 'var(--text3)', fontSize: 10 }}>·</span>
                              )}
                              <span className="text-[11px]" style={{ color: 'var(--text3)' }}>
                                {entry.label}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status badge */}
                      <div className="hidden flex-shrink-0 sm:block">
                        <StatusBadge status={entry.status} />
                      </div>

                      {/* Date */}
                      <div className="hidden w-24 flex-shrink-0 text-right md:block">
                        <span className="tabular-nums" style={{ fontSize: 11.5, color: 'var(--text2)' }}>
                          {formatDate(entry.expectedDate)}
                        </span>
                      </div>

                      {/* Amount */}
                      <div className="w-24 flex-shrink-0 text-right">
                        <span
                          className="tabular-nums"
                          style={{
                            fontSize: 14.5,
                            fontWeight: 650,
                            letterSpacing: '-0.03em',
                            color:
                              entry.status === 'received'
                                ? 'var(--green)'
                                : entry.status === 'cancelled'
                                ? 'var(--text3)'
                                : 'var(--accent2)',
                          }}
                        >
                          {formatCurrency(entry.amount, entry.currency)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="w-8 flex-shrink-0 flex items-center justify-end">
                        {actionItems.length > 0 ? (
                          <ActionMenu
                            label={`Actions for ${entry.projectName} entry`}
                            items={actionItems}
                          />
                        ) : null}
                      </div>
                    </m.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </m.section>
        ))}
      </AnimatePresence>

      <MarkScheduleReceivedModal
        entry={receivingEntry}
        open={!!receivingEntry}
        onClose={() => setReceivingEntry(null)}
        onSuccess={handleMarkReceived}
      />
    </div>
  )
}

function recalcTotals(entries: EnrichedEntry[]): Record<string, number> {
  return entries
    .filter(e => e.status === 'scheduled')
    .reduce((map, e) => {
      map[e.currency] = (map[e.currency] ?? 0) + e.amount
      return map
    }, {} as Record<string, number>)
}

'use client'

import { AnimatePresence, LayoutGroup, m, useReducedMotion } from 'motion/react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ActionMenu } from '@/components/ui/action-menu'
import type { Client, Payment, Project } from '@/types'

interface Props {
  payments: Payment[]
  clients: Pick<Client, 'id' | 'name'>[]
  /** Optional: used to show project name on linked payments */
  projects?: Pick<Project, 'id' | 'name'>[]
  onEdit: (payment: Payment) => void
  onDelete: (id: string) => void
  deletingId: string | null
}

interface MonthGroup {
  key: string
  label: string
  payments: Payment[]
}

function isFuture(dateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(dateStr + 'T00:00:00')
  return date > today
}

function groupByMonth(payments: Payment[]): MonthGroup[] {
  const groupsMap = new Map<string, MonthGroup>()
  const sortedPayments = [...payments].sort(
    (a, b) =>
      new Date(b.received_at + 'T00:00:00').getTime() -
      new Date(a.received_at + 'T00:00:00').getTime()
  )

  for (const p of sortedPayments) {
    const date = new Date(p.received_at + 'T00:00:00')
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })

    const existing = groupsMap.get(key)
    if (existing) {
      existing.payments.push(p)
    } else {
      groupsMap.set(key, { key, label, payments: [p] })
    }
  }

  return Array.from(groupsMap.values()).sort((a, b) => b.key.localeCompare(a.key))
}

const ease = [0.22, 1, 0.36, 1] as const

export function PaymentList({ payments, clients, projects, onEdit, onDelete, deletingId }: Props) {
  const shouldReduceMotion = useReducedMotion()
  const clientMap = new Map(clients.map((c) => [c.id, c.name]))
  const projectMap = new Map((projects ?? []).map((p) => [p.id, p.name]))

  if (payments.length === 0) {
    return (
      <div
        className="panel-surface card-interactive rounded-[18px] p-10 text-center"
        style={{ border: '1px solid var(--border)' }}
      >
        <p className="form-card-title text-[24px]">
          No payments yet
        </p>
        <p className="mx-auto mt-3 max-w-md form-card-copy">
          Start with your first logged payment and the history view will take on the same premium cadence as Projects.
        </p>
      </div>
    )
  }

  const groups = groupByMonth(payments)

  return (
    <LayoutGroup>
      <div className="space-y-5">
        <AnimatePresence initial={false}>
          {groups.map((group) => (
            <m.div
              key={group.key}
              layout
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.22, ease }}
            >
              <div className="mb-3 flex items-end justify-between gap-3 px-1">
                <p className="list-section-heading">
                  {group.label}
                </p>
                <span className="list-section-meta">
                  {group.payments.length} {group.payments.length === 1 ? 'payment' : 'payments'}
                </span>
              </div>

              <m.div
                layout
                className="panel-surface card-interactive rounded-[18px] overflow-hidden"
                style={{ border: '1px solid var(--border)' }}
              >
                <AnimatePresence initial={false}>
                  {group.payments.map((payment, i) => {
                    const clientName = payment.client_id
                      ? (clientMap.get(payment.client_id) ?? 'Unknown client')
                      : 'No client'
                    const projectName = payment.project_id
                      ? projectMap.get(payment.project_id)
                      : null
                    const isLast = i === group.payments.length - 1
                    const future = isFuture(payment.received_at)

                    return (
                      <m.div
                        key={payment.id}
                        layout
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 8, scale: 0.992 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.99 }}
                        transition={
                          shouldReduceMotion
                            ? { duration: 0 }
                            : { duration: 0.2, ease, layout: { duration: 0.24, ease } }
                        }
                        whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                        className="row-hover flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
                        style={{
                          borderBottom: !isLast ? '1px solid var(--border)' : undefined,
                        }}
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              background: future ? 'var(--accent2)' : 'var(--green)',
                              boxShadow: future
                                ? '0 0 6px rgba(124, 150, 255, 0.50)'
                                : '0 0 6px rgba(34, 216, 122, 0.50)',
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p
                                className="truncate"
                                style={{
                                  fontSize: '15px',
                                  fontWeight: 620,
                                  color: 'var(--text)',
                                  letterSpacing: '-0.03em',
                                  lineHeight: 1.15,
                                }}
                              >
                                {clientName}
                              </p>
                              {projectName ? (
                                <span className="status-chip">
                                  {projectName}
                                </span>
                              ) : null}
                              {future ? (
                                <span className="status-chip" data-tone="neutral">
                                  Scheduled
                                </span>
                              ) : null}
                            </div>
                            {payment.notes ? (
                              <p
                                className="mt-1.5 truncate"
                                style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.55 }}
                              >
                                {payment.notes}
                              </p>
                            ) : projectName ? (
                              <p
                                className="mt-1.5 truncate"
                                style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.55 }}
                              >
                                Linked project payment
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="ml-5 flex items-center justify-between gap-4 sm:ml-4 sm:flex-shrink-0">
                          <div className="flex flex-col items-end gap-1 text-right">
                            <span
                              className="tabular-nums"
                              style={{
                                fontSize: 18,
                                fontWeight: 660,
                                letterSpacing: '-0.05em',
                                color: future ? 'var(--accent2)' : 'var(--green)',
                                textShadow: future
                                  ? '0 0 16px rgba(124, 150, 255, 0.18)'
                                  : '0 0 16px rgba(34, 216, 122, 0.18)',
                              }}
                            >
                              {formatCurrency(payment.amount, payment.currency)}
                            </span>
                            <span style={{ fontSize: '11.5px', color: 'var(--text2)', letterSpacing: '0.01em' }}>
                              {formatDate(payment.received_at)}
                            </span>
                          </div>

                          <ActionMenu
                            label={`Actions for payment on ${payment.received_at}`}

                            items={[
                              { label: 'Edit', onSelect: () => onEdit(payment) },
                              {
                                label: deletingId === payment.id ? 'Deleting…' : 'Delete',
                                onSelect: () => onDelete(payment.id),
                                tone: 'danger',
                                disabled: deletingId === payment.id,
                              },
                            ]}
                          />
                        </div>
                      </m.div>
                    )
                  })}
                </AnimatePresence>
              </m.div>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  )
}

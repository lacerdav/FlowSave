'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, LayoutGroup, m, useReducedMotion } from 'motion/react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MarkReceivedModal } from './MarkReceivedModal'
import { ActionMenu } from '@/components/ui/action-menu'
import type { Client, Payment, Project, ProjectStatus, ProjectSubStatus, ScheduleEntry } from '@/types'

interface Props {
  projects: Project[]
  clients: Pick<Client, 'id' | 'name' | 'currency'>[]
  scheduleEntries: ScheduleEntry[]
  onEdit: (project: Project) => void
  onMoveToNegotiating: (project: Project) => void
  onMoveToConfirmed: (project: Project) => void
  onCancelProject: (project: Project) => void
  onDelete: (id: string) => void
  onMarkReceived: (payment: Payment, updatedProject: Project) => void
  onManageSchedule: (project: Project) => void
  deletingId: string | null
  highlightedProjectId: string | null
}

interface StatusConfig {
  label: string
  color: string
  dim: string
  dotColor: string
  border: string
  chipClassName?: string
  badgeGlow?: string
  dotGlow?: string
}

type GroupKey = 'confirmed' | 'pending' | 'received' | 'cancelled'

const ease = [0.22, 1, 0.36, 1] as const

const STATUS_CONFIG: Record<ProjectStatus, StatusConfig> = {
  pending: {
    label: 'Pending',
    color: 'var(--amber)',
    dim: 'rgba(245, 166, 35, 0.12)',
    dotColor: 'var(--amber)',
    border: 'rgba(245, 166, 35, 0.28)',
    badgeGlow: '0 0 10px rgba(245, 166, 35, 0.22), 0 0 4px rgba(245, 166, 35, 0.12)',
    dotGlow: '0 0 6px rgba(245, 166, 35, 0.60), 0 0 14px rgba(245, 166, 35, 0.28)',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'var(--accent2)',
    dim: 'rgba(91, 127, 255, 0.15)',
    dotColor: 'var(--accent2)',
    border: 'rgba(124, 150, 255, 0.34)',
    badgeGlow: '0 0 12px rgba(91, 127, 255, 0.30), 0 0 5px rgba(91, 127, 255, 0.16)',
    dotGlow: '0 0 7px rgba(124, 150, 255, 0.65), 0 0 16px rgba(91, 127, 255, 0.32)',
  },
  received: {
    label: 'Received',
    color: 'var(--green)',
    dim: 'rgba(34, 216, 122, 0.12)',
    dotColor: 'var(--green)',
    border: 'rgba(34, 216, 122, 0.28)',
    badgeGlow: '0 0 10px rgba(34, 216, 122, 0.26), 0 0 4px rgba(34, 216, 122, 0.14)',
    dotGlow: '0 0 6px rgba(34, 216, 122, 0.62), 0 0 14px rgba(34, 216, 122, 0.28)',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'var(--text3)',
    dim: 'rgba(255, 255, 255, 0.03)',
    dotColor: 'rgba(240,240,255,0.20)',
    border: 'rgba(255, 255, 255, 0.07)',
  },
}

const GROUP_STYLE: Record<GroupKey, {
  headingColor: string
  headingGlow: string
  borderColor: string
  containerGlow: string
}> = {
  confirmed: {
    headingColor: 'rgba(180, 200, 255, 0.88)',
    headingGlow: '0 0 18px rgba(124, 150, 255, 0.22)',
    borderColor: 'rgba(124, 150, 255, 0.18)',
    containerGlow: '0 4px 24px rgba(91, 127, 255, 0.07), 0 0 48px rgba(91, 127, 255, 0.04)',
  },
  pending: {
    headingColor: 'rgba(255, 228, 160, 0.84)',
    headingGlow: '0 0 16px rgba(245, 166, 35, 0.22)',
    borderColor: 'rgba(245, 166, 35, 0.18)',
    containerGlow: '0 4px 24px rgba(245, 166, 35, 0.07), 0 0 48px rgba(245, 166, 35, 0.04)',
  },
  received: {
    headingColor: 'rgba(190, 255, 220, 0.86)',
    headingGlow: '0 0 16px rgba(34, 216, 122, 0.22)',
    borderColor: 'rgba(34, 216, 122, 0.18)',
    containerGlow: '0 4px 32px rgba(34, 216, 122, 0.10), 0 0 60px rgba(34, 216, 122, 0.06)',
  },
  cancelled: {
    headingColor: 'rgba(200, 200, 220, 0.46)',
    headingGlow: 'none',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    containerGlow: 'none',
  },
}

const SUB_STATUS_LABEL: Record<ProjectSubStatus, string> = {
  prospecting: 'Prospecting',
  negotiating: 'Negotiating',
}

const PENDING_STAGE_CONFIG: Record<ProjectSubStatus, StatusConfig> = {
  prospecting: {
    label: 'Prospecting',
    color: 'rgba(230, 222, 255, 0.90)',
    dim: 'rgba(139, 92, 246, 0.12)',
    dotColor: 'rgba(167, 139, 250, 0.92)',
    border: 'rgba(167, 139, 250, 0.24)',
    chipClassName: 'status-chip--prospecting',
    badgeGlow: '0 0 10px rgba(139, 92, 246, 0.14), 0 0 4px rgba(139, 92, 246, 0.08)',
    dotGlow: '0 0 6px rgba(139, 92, 246, 0.34), 0 0 14px rgba(139, 92, 246, 0.14)',
  },
  negotiating: {
    label: 'Negotiating',
    color: 'rgba(255, 226, 173, 0.96)',
    dim: 'rgba(255, 184, 77, 0.14)',
    dotColor: 'rgba(255, 184, 77, 1)',
    border: 'rgba(255, 184, 77, 0.28)',
    chipClassName: 'status-chip--negotiating',
    badgeGlow: '0 0 12px rgba(245, 166, 35, 0.20), 0 0 5px rgba(255, 184, 77, 0.12)',
    dotGlow: '0 0 7px rgba(255, 184, 77, 0.46), 0 0 16px rgba(245, 166, 35, 0.18)',
  },
}

function getStatusLabel(project: Project): string {
  if (project.status === 'pending' && project.sub_status) {
    return SUB_STATUS_LABEL[project.sub_status]
  }
  return STATUS_CONFIG[project.status].label
}

function getStatusConfig(project: Project): StatusConfig {
  if (project.status === 'pending') {
    return PENDING_STAGE_CONFIG[project.sub_status ?? 'prospecting']
  }

  return STATUS_CONFIG[project.status]
}

function getPendingAmbientShadow(project: Project): string | undefined {
  if (project.status !== 'pending') return undefined

  const base = '0 0 20px rgba(245, 166, 35, 0.05)'

  if (project.sub_status === 'negotiating') {
    return `${base}, 0 0 42px rgba(245, 166, 35, 0.08)`
  }

  return `${base}, 0 0 38px rgba(139, 92, 246, 0.09)`
}

function mergeShadows(interactiveShadow: string | undefined, ambientShadow: string | undefined): string | undefined {
  if (interactiveShadow && ambientShadow) return `${interactiveShadow}, ${ambientShadow}`
  return interactiveShadow ?? ambientShadow
}

function amountColor(status: ProjectStatus): string {
  if (status === 'received') return 'var(--green)'
  if (status === 'cancelled') return 'var(--text3)'
  return 'var(--accent2)'
}

export function ProjectList({
  projects,
  clients,
  scheduleEntries,
  onEdit,
  onMoveToNegotiating,
  onMoveToConfirmed,
  onCancelProject,
  onDelete,
  onMarkReceived,
  onManageSchedule,
  deletingId,
  highlightedProjectId,
}: Props) {
  const shouldReduceMotion = useReducedMotion()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [receivingProject, setReceivingProject] = useState<Project | null>(null)
  const clientMap = new Map(clients.map(c => [c.id, c]))

  // Map project_id → scheduled entry count
  const scheduledCountByProject = scheduleEntries.reduce((map, e) => {
    if (e.status === 'scheduled') {
      map.set(e.project_id, (map.get(e.project_id) ?? 0) + 1)
    }
    return map
  }, new Map<string, number>())

  if (projects.length === 0) {
    return (
      <div
        className="panel-surface rounded-xl p-10 text-center"
        style={{ border: '1px solid var(--border)' }}
      >
        <p className="form-card-title">No projects yet</p>
        <p className="mt-2 form-card-copy">
          Add a project above to start tracking future income.
        </p>
        <Link
          href="/clients"
          className="mt-4 inline-block text-xs underline"
          style={{ color: 'var(--accent2)' }}
        >
          {clients.length === 0 ? 'Add a client first →' : 'View clients →'}
        </Link>
      </div>
    )
  }

  const confirmed = projects.filter(p => p.status === 'confirmed')
  const pending    = projects.filter(p => p.status === 'pending')
  const received   = projects.filter(p => p.status === 'received')
  const cancelled  = projects.filter(p => p.status === 'cancelled')

  const groups: { key: GroupKey; label: string; items: Project[] }[] = []
  if (confirmed.length) groups.push({ key: 'confirmed', label: 'Confirmed', items: confirmed })
  if (pending.length)   groups.push({ key: 'pending',   label: 'Pending',   items: pending })
  if (received.length)  groups.push({ key: 'received',  label: 'Received',  items: received })
  if (cancelled.length) groups.push({ key: 'cancelled', label: 'Cancelled', items: cancelled })

  return (
    <>
      <LayoutGroup>
        <div className="space-y-5">
          <AnimatePresence initial={false}>
            {groups.map(group => {
              const tone = GROUP_STYLE[group.key]

              return (
                <m.section
                  key={group.key}
                  layout
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.24, ease }}
                >
                  <p
                    className="project-group-heading mb-2 px-1"
                    style={{ color: tone.headingColor, textShadow: tone.headingGlow }}
                  >
                    {group.label}
                  </p>
                  <m.div
                    layout
                    className="panel-surface rounded-xl overflow-hidden"
                    style={{
                      border: `1px solid ${tone.borderColor}`,
                      boxShadow: tone.containerGlow !== 'none' ? tone.containerGlow : undefined,
                    }}
                  >
                    <AnimatePresence initial={false}>
                      {group.items.map((project, index) => {
                        const client = project.client_id ? clientMap.get(project.client_id) : undefined
                        const status = getStatusConfig(project)
                        const isHovered = hoveredId === project.id
                        const isDeleting = deletingId === project.id
                        const isHighlighted = highlightedProjectId === project.id
                        const displayLabel = getStatusLabel(project)
                        const hasSchedule = scheduledCountByProject.has(project.id)
                        const ambientShadow = getPendingAmbientShadow(project)
                        const interactiveShadow = isHighlighted
                          ? 'inset 3px 0 0 rgba(124, 150, 255, 0.54), inset 0 0 0 1px rgba(154, 177, 255, 0.16), 0 0 32px rgba(73, 106, 207, 0.14)'
                          : isHovered
                            ? '0 16px 34px rgba(5, 10, 24, 0.26), 0 0 28px rgba(68, 97, 192, 0.10)'
                            : undefined
                        const isPendingProspecting = project.status === 'pending'
                          && (project.sub_status ?? 'prospecting') === 'prospecting'
                        const isPendingNegotiating = project.status === 'pending'
                          && (project.sub_status ?? 'prospecting') === 'negotiating'
                        const actionItems =
                          project.status === 'pending'
                            ? [
                                ...(isPendingProspecting
                                  ? [{ label: 'Move to Negotiating', onSelect: () => onMoveToNegotiating(project) }]
                                  : []),
                                ...(isPendingNegotiating
                                  ? [{
                                      label: 'Move to Confirmed',
                                      onSelect: () => onMoveToConfirmed(project),
                                      tone: 'accent' as const,
                                    }]
                                  : []),
                                ...(isPendingNegotiating
                                  ? [{ label: 'Edit', onSelect: () => onEdit(project) }]
                                  : []),
                                { label: 'Cancel', onSelect: () => onCancelProject(project), tone: 'warning' as const },
                                {
                                  label: isDeleting ? 'Deleting…' : 'Delete',
                                  onSelect: () => onDelete(project.id),
                                  tone: 'danger' as const,
                                  disabled: isDeleting,
                                },
                              ]
                            : [
                                ...(project.status === 'confirmed'
                                  ? [{ label: 'Receive', onSelect: () => setReceivingProject(project), tone: 'success' as const }]
                                  : []),
                                ...(project.status === 'confirmed'
                                  ? [{
                                      label: hasSchedule ? 'Manage schedule' : 'Set payment plan',
                                      onSelect: () => onManageSchedule(project),
                                    }]
                                  : []),
                                { label: 'Edit', onSelect: () => onEdit(project) },
                                ...(project.status === 'confirmed'
                                  ? [{ label: 'Cancel', onSelect: () => onCancelProject(project), tone: 'warning' as const }]
                                  : []),
                                {
                                  label: isDeleting ? 'Deleting…' : 'Delete',
                                  onSelect: () => onDelete(project.id),
                                  tone: 'danger' as const,
                                  disabled: isDeleting,
                                },
                              ]

                        return (
                          <m.div
                            key={project.id}
                            layout
                            layoutId={`project-row-${project.id}`}
                            initial={shouldReduceMotion ? false : { opacity: 0, y: 8, scale: 0.995 }}
                            animate={
                              shouldReduceMotion
                                ? { opacity: 1 }
                                : {
                                    opacity: 1,
                                    y: isHovered ? -1 : 0,
                                    scale: isHighlighted ? [1, 1.006, 1] : 1,
                                  }
                            }
                            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.99 }}
                            transition={
                              shouldReduceMotion
                                ? { duration: 0 }
                                : {
                                    duration: isHighlighted ? 0.34 : 0.22,
                                    ease,
                                    layout: { duration: 0.26, ease },
                                  }
                            }
                            className="project-row flex items-center gap-3 px-5 py-4"
                            style={{
                              background: isHighlighted
                                ? 'linear-gradient(90deg, rgba(28, 40, 82, 0.82) 0%, rgba(13, 19, 44, 0.62) 100%)'
                                : isHovered
                                  ? 'linear-gradient(90deg, rgba(22, 32, 64, 0.56) 0%, rgba(13, 18, 40, 0.40) 100%)'
                                  : 'transparent',
                              boxShadow: mergeShadows(interactiveShadow, ambientShadow),
                              borderBottom: index !== group.items.length - 1 ? '1px solid var(--border)' : undefined,
                            }}
                            onMouseEnter={() => setHoveredId(project.id)}
                            onMouseLeave={() => setHoveredId(current => current === project.id ? null : current)}
                          >
                            {/* Status dot */}
                            <m.div
                              layout
                              className="h-2 w-2 flex-shrink-0 rounded-full"
                              animate={
                                shouldReduceMotion
                                  ? undefined
                                  : { scale: isHighlighted ? [1, 1.16, 1] : 1 }
                              }
                              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.26, ease }}
                              style={{
                                background: status.dotColor,
                                boxShadow: project.status !== 'cancelled' ? status.dotGlow : undefined,
                              }}
                            />

                            {/* Name + client */}
                            <div className="min-w-0 flex-1">
                              <p
                                className="project-row-title truncate"
                                style={{
                                  color: project.status === 'cancelled' ? 'var(--text3)' : 'rgba(224, 238, 255, 0.98)',
                                  textDecoration: project.status === 'cancelled' ? 'line-through' : undefined,
                                  textShadow: project.status === 'cancelled' ? 'none' : '0 0 18px rgba(95, 132, 255, 0.12)',
                                }}
                              >
                                {project.name}
                              </p>
                              {client ? (
                                <p className="project-row-client mt-1">
                                  {client.name}
                                </p>
                              ) : null}
                              {project.status === 'confirmed' && !hasSchedule ? (
                                <button
                                  type="button"
                                  className="set-plan-cta mt-1.5 md:hidden"
                                  onClick={() => onManageSchedule(project)}
                                >
                                  Set schedule →
                                </button>
                              ) : null}
                            </div>

                            {/* Status badge — fixed zone */}
                            <div className="hidden w-28 flex-shrink-0 sm:flex sm:justify-center">
                              <AnimatePresence initial={false}>
                                <m.span
                                  key={project.id}
                                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.94, y: 4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96, y: -4 }}
                                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease }}
                                  className={`status-chip whitespace-nowrap ${status.chipClassName ?? ''}`}
                                  style={{
                                    borderRadius: 8,
                                    background: status.chipClassName ? undefined : status.dim,
                                    color: status.chipClassName ? undefined : status.color,
                                    border: status.chipClassName ? undefined : `1px solid ${status.border}`,
                                    boxShadow: status.badgeGlow,
                                  }}
                                >
                                  {displayLabel}
                                </m.span>
                              </AnimatePresence>
                            </div>

                            {/* Date / schedule badge — fixed zone */}
                            <div className="hidden w-36 flex-shrink-0 text-right md:flex md:flex-col md:items-end md:justify-center">
                              {project.status === 'confirmed' && hasSchedule ? (
                                <span
                                  className="project-schedule-pill"
                                  style={{
                                    justifyContent: 'center',
                                  }}
                                >
                                  {scheduledCountByProject.get(project.id)} entries
                                </span>
                              ) : project.status === 'confirmed' ? (
                                <button
                                  type="button"
                                  className="set-plan-cta"
                                  onClick={() => onManageSchedule(project)}
                                >
                                  Set schedule →
                                </button>
                              ) : (
                                <span
                                  className="tabular-nums"
                                  style={{ fontSize: 11.5, color: 'var(--text2)', letterSpacing: '0.01em' }}
                                >
                                  {project.expected_date ? formatDate(project.expected_date) : '—'}
                                </span>
                              )}
                            </div>

                            {/* Amount — fixed zone */}
                            <div className="w-32 flex-shrink-0 text-right">
                              <span
                                className="tabular-nums"
                                style={{
                                  fontSize: 14.5,
                                  fontWeight: 650,
                                  letterSpacing: '-0.03em',
                                  color: amountColor(project.status),
                                  textShadow: project.status === 'received'
                                    ? '0 0 14px rgba(34, 216, 122, 0.18)'
                                    : project.status === 'cancelled'
                                      ? 'none'
                                      : '0 0 16px rgba(124, 150, 255, 0.18)',
                                }}
                              >
                                {project.expected_amount != null && project.expected_amount > 0
                                  ? formatCurrency(project.expected_amount, client?.currency ?? 'USD')
                                  : <span style={{ fontSize: 11.5, color: 'var(--text3)', fontWeight: 400, letterSpacing: 0 }}>TBD</span>
                                }
                              </span>
                            </div>

                            {/* Actions — fixed zone */}
                            <div
                              className="w-10 flex-shrink-0 flex items-center justify-end"
                              style={{
                                opacity: isHovered || isHighlighted || isDeleting ? 1 : 0.86,
                              }}
                            >
                              <ActionMenu
                                label={`Actions for ${project.name}`}
                                items={actionItems}
                              />
                            </div>
                          </m.div>
                        )
                      })}
                    </AnimatePresence>
                  </m.div>
                </m.section>
              )
            })}
          </AnimatePresence>
        </div>
      </LayoutGroup>

      {receivingProject ? (
        <MarkReceivedModal
          project={receivingProject}
          client={receivingProject.client_id ? (clientMap.get(receivingProject.client_id) ?? null) : null}
          open={!!receivingProject}
          onClose={() => setReceivingProject(null)}
          onSuccess={(payment, updatedProject) => {
            setReceivingProject(null)
            onMarkReceived(payment, updatedProject)
          }}
        />
      ) : null}
    </>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Client, Project, ProjectStatus } from '@/types'

interface Props {
  projects: Project[]
  clients: Pick<Client, 'id' | 'name' | 'currency'>[]
  onEdit: (project: Project) => void
  onDelete: (id: string) => void
  deletingId: string | null
}

interface StatusConfig {
  label: string
  color: string
  dim: string
  dotColor: string
  border: string
  /** extra box-shadow on the badge pill — only for high-signal statuses */
  badgeGlow?: string
  /** extra box-shadow on the status dot */
  dotGlow?: string
}

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

function amountColor(status: ProjectStatus): string {
  if (status === 'received')  return 'var(--green)'
  if (status === 'cancelled') return 'var(--text3)'
  return 'var(--accent2)'
}

export function ProjectList({ projects, clients, onEdit, onDelete, deletingId }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const clientMap = new Map(clients.map(c => [c.id, c]))

  if (projects.length === 0) {
    return (
      <div
        className="panel-surface rounded-xl p-10 text-center"
        style={{ border: '1px solid var(--border)' }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--text2)' }}>
          No projects yet
        </p>
        <p className="mt-1.5 text-xs" style={{ color: 'var(--text3)' }}>
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

  // Group: active (pending + confirmed) → received → cancelled
  const active    = projects.filter(p => p.status === 'pending' || p.status === 'confirmed')
  const received  = projects.filter(p => p.status === 'received')
  const cancelled = projects.filter(p => p.status === 'cancelled')

  const groups: { key: string; label: string; items: Project[] }[] = []
  if (active.length)    groups.push({ key: 'active',    label: 'Active',    items: active })
  if (received.length)  groups.push({ key: 'received',  label: 'Received',  items: received })
  if (cancelled.length) groups.push({ key: 'cancelled', label: 'Cancelled', items: cancelled })

  function renderRow(project: Project, isLast: boolean) {
    const client = project.client_id ? clientMap.get(project.client_id) : null
    const status = STATUS_CONFIG[project.status]
    const isHovered = hoveredId === project.id
    const isDeleting = deletingId === project.id

    return (
      <div
        key={project.id}
        className="flex items-center gap-3 px-5 py-4 transition-colors"
        style={{
          background: isHovered
            ? 'linear-gradient(90deg, rgba(25, 36, 72, 0.64) 0%, rgba(14, 20, 46, 0.44) 100%)'
            : 'transparent',
          boxShadow: isHovered
            ? 'inset 3px 0 0 rgba(91, 127, 255, 0.40), inset 0 0 0 1px rgba(130, 158, 255, 0.09)'
            : undefined,
          borderBottom: !isLast ? '1px solid var(--border)' : undefined,
        }}
        onMouseEnter={() => setHoveredId(project.id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        {/* Status indicator dot */}
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200"
          style={{
            background: status.dotColor,
            boxShadow: isHovered ? status.dotGlow : (project.status !== 'cancelled' ? status.dotGlow : undefined),
          }}
        />

        {/* Name + client */}
        <div className="flex-1 min-w-0">
          <p
            className="truncate font-medium"
            style={{
              fontSize: 13.5,
              color: project.status === 'cancelled' ? 'var(--text3)' : 'var(--text)',
              textDecoration: project.status === 'cancelled' ? 'line-through' : undefined,
              letterSpacing: '-0.01em',
            }}
          >
            {project.name}
          </p>
          {client && (
            <p className="mt-0.5 truncate" style={{ fontSize: 11, color: 'var(--text3)' }}>
              {client.name}
            </p>
          )}
        </div>

        {/* Status badge */}
        <span
          className="hidden sm:block flex-shrink-0 px-2.5 py-[3px] rounded-md font-medium tracking-wide"
          style={{
            fontSize: 10.5,
            background: status.dim,
            color: status.color,
            border: `1px solid ${status.border}`,
            boxShadow: status.badgeGlow,
            letterSpacing: '0.04em',
          }}
        >
          {status.label}
        </span>

        {/* Date */}
        <span
          className="hidden md:block flex-shrink-0 tabular-nums"
          style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.01em' }}
        >
          {formatDate(project.expected_date)}
        </span>

        {/* Amount */}
        <span
          className="flex-shrink-0 tabular-nums"
          style={{
            fontSize: 14,
            fontWeight: 640,
            letterSpacing: '-0.025em',
            color: amountColor(project.status),
          }}
        >
          {formatCurrency(
            project.expected_amount,
            client?.currency ?? 'USD'
          )}
        </span>

        {/* Edit + Remove (hover) */}
        <div
          className="flex items-center gap-3 flex-shrink-0 transition-opacity"
          style={{ opacity: isHovered || isDeleting ? 1 : 0, pointerEvents: isHovered || isDeleting ? 'auto' : 'none' }}
        >
          <button
            onClick={() => onEdit(project)}
            className="text-xs transition-colors"
            style={{ color: 'var(--accent2)', fontWeight: 500 }}
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(project.id)}
            disabled={isDeleting}
            className="text-xs transition-colors"
            style={{ color: 'var(--red)', fontWeight: 500 }}
          >
            {isDeleting ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {groups.map(group => (
        <div key={group.key}>
          <p
            className="mb-2 px-1 text-[10px] font-semibold tracking-[0.16em] uppercase"
            style={{ color: 'var(--text3)' }}
          >
            {group.label}
          </p>
          <div
            className="panel-surface rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border)' }}
          >
            {group.items.map((project, i) =>
              renderRow(project, i === group.items.length - 1)
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

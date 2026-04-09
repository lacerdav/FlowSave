'use client'

import { useEffect, useState } from 'react'
import { AddProjectModal } from './AddProjectModal'
import { EditProjectModal } from './EditProjectModal'
import { MoveToNegotiatingModal } from './MoveToNegotiatingModal'
import { PaymentPlanModal } from './PaymentPlanModal'
import { ProjectList } from './ProjectList'
import type { Client, Payment, Project, ProjectStatus, ProjectSubStatus, ScheduleEntry } from '@/types'

interface Props {
  initialProjects: Project[]
  initialScheduleEntries: ScheduleEntry[]
  clients: Pick<Client, 'id' | 'name' | 'currency'>[]
}

type SaveValues = {
  name: string
  client_id: string | null
  expected_amount: number | null
  expected_date: string | null
  status: ProjectStatus
  sub_status: ProjectSubStatus | null
}

export function ProjectsPageClient({ initialProjects, initialScheduleEntries, clients }: Props) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>(initialScheduleEntries)
  const [showAddProject, setShowAddProject] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [transitioningProject, setTransitioningProject] = useState<Project | null>(null)
  const [schedulingProject, setSchedulingProject] = useState<Project | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [highlightedProjectId, setHighlightedProjectId] = useState<string | null>(null)

  useEffect(() => {
    if (!highlightedProjectId) return
    const timeout = window.setTimeout(() => setHighlightedProjectId(null), 900)
    return () => window.clearTimeout(timeout)
  }, [highlightedProjectId])

  function sortProjects(nextProjects: Project[]) {
    return [...nextProjects].sort((a, b) => (a.expected_date ?? '').localeCompare(b.expected_date ?? ''))
  }

  async function handleSave(values: SaveValues, editingId: string | null) {
    if (editingId) {
      const res = await fetch(`/api/projects/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = await res.json() as Project & { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to update project.')
      setProjects(prev => sortProjects(prev.map(p => p.id === editingId ? json : p)))
      setHighlightedProjectId(json.id)
      setEditing(null)
    } else {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = await res.json() as Project & { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to add project.')
      setProjects(prev => sortProjects([...prev, json]))
      setHighlightedProjectId(json.id)
      setShowAddProject(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setProjects(prev => prev.filter(p => p.id !== id))
      if (editing?.id === id) setEditing(null)
    }
    setDeletingId(null)
  }

  async function handleCancelProject(project: Project) {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' as ProjectStatus }),
    })

    const json = await res.json().catch(() => ({})) as Project & { error?: string }
    if (!res.ok) return

    setProjects(prev => sortProjects(prev.map(p => p.id === project.id ? json : p)))
    setHighlightedProjectId(project.id)
    if (editing?.id === project.id) setEditing(json)
  }

  async function handleMoveToNegotiating(values: {
    expected_amount?: number
    expected_date?: string
  }) {
    if (!transitioningProject) return

    const body: {
      sub_status: ProjectSubStatus
      expected_amount?: number
      expected_date?: string
    } = {
      sub_status: 'negotiating',
    }

    if (values.expected_amount !== undefined) {
      body.expected_amount = values.expected_amount
    }

    if (values.expected_date) {
      body.expected_date = values.expected_date
    }

    const res = await fetch(`/api/projects/${transitioningProject.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const json = await res.json().catch(() => ({})) as Project & { error?: string }
    if (!res.ok) throw new Error(json.error ?? 'Failed to move project to negotiating.')

    setProjects(prev => sortProjects(prev.map(project => project.id === json.id ? json : project)))
    setHighlightedProjectId(json.id)
    if (editing?.id === json.id) setEditing(json)
    setTransitioningProject(null)
  }

  async function handleMoveToConfirmed(project: Project) {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'confirmed' as ProjectStatus,
        sub_status: null,
      }),
    })

    const json = await res.json().catch(() => ({})) as Project & { error?: string }
    if (!res.ok) return

    setProjects(prev => sortProjects(prev.map(item => item.id === json.id ? json : item)))
    setHighlightedProjectId(json.id)
    if (editing?.id === json.id) setEditing(json)
    setSchedulingProject(json)
  }

  function handleMarkReceived(_payment: Payment, updatedProject: Project) {
    setProjects(prev => sortProjects(prev.map(p => p.id === updatedProject.id ? updatedProject : p)))
    setHighlightedProjectId(updatedProject.id)
  }

  function handleScheduleUpdate(projectId: string, newEntries: ScheduleEntry[]) {
    setScheduleEntries(prev => [
      ...prev.filter(e => e.project_id !== projectId),
      ...newEntries,
    ])
    setHighlightedProjectId(projectId)
    setSchedulingProject(null)
  }

  const clientMap = new Map(clients.map(c => [c.id, c]))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: 'clamp(22px,2.4vw,26px)', fontWeight: 640, letterSpacing: '-0.045em', color: 'var(--text)' }}>
          Projects
        </h1>
        <button className="add-entry-btn" onClick={() => setShowAddProject(true)}>
          + Add Project
        </button>
      </div>
      <ProjectList
        projects={projects}
        clients={clients}
        scheduleEntries={scheduleEntries}
        onEdit={setEditing}
        onMoveToNegotiating={setTransitioningProject}
        onMoveToConfirmed={handleMoveToConfirmed}
        onCancelProject={handleCancelProject}
        onDelete={handleDelete}
        onMarkReceived={handleMarkReceived}
        onManageSchedule={setSchedulingProject}
        deletingId={deletingId}
        highlightedProjectId={highlightedProjectId}
      />
      <AddProjectModal
        open={showAddProject}
        onClose={() => setShowAddProject(false)}
        onSave={handleSave}
        clients={clients}
      />
      {transitioningProject ? (
        <MoveToNegotiatingModal
          project={transitioningProject}
          client={transitioningProject.client_id ? (clientMap.get(transitioningProject.client_id) ?? null) : null}
          open={!!transitioningProject}
          onClose={() => setTransitioningProject(null)}
          onSubmit={handleMoveToNegotiating}
        />
      ) : null}
      <EditProjectModal
        clients={clients}
        project={editing}
        open={!!editing}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />
      {schedulingProject && (
        <PaymentPlanModal
          project={schedulingProject}
          client={schedulingProject.client_id ? (clientMap.get(schedulingProject.client_id) ?? null) : null}
          open={!!schedulingProject}
          onClose={() => setSchedulingProject(null)}
          onSuccess={entries => handleScheduleUpdate(schedulingProject.id, entries)}
          existingEntries={scheduleEntries.filter(e => e.project_id === schedulingProject.id)}
        />
      )}
    </div>
  )
}

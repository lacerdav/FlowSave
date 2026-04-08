'use client'

import { useEffect, useState } from 'react'
import { EditProjectModal } from './EditProjectModal'
import { ProjectForm } from './ProjectForm'
import { ProjectList } from './ProjectList'
import type { Client, Payment, Project, ProjectStatus, ProjectSubStatus } from '@/types'

interface Props {
  initialProjects: Project[]
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

export function ProjectsPageClient({ initialProjects, clients }: Props) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [editing, setEditing] = useState<Project | null>(null)
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

  function handleMarkReceived(_payment: Payment, updatedProject: Project) {
    setProjects(prev => sortProjects(prev.map(p => p.id === updatedProject.id ? updatedProject : p)))
    setHighlightedProjectId(updatedProject.id)
  }

  return (
    <div className="space-y-6">
      <ProjectForm
        clients={clients}
        editing={null}
        onSave={handleSave}
        onCancel={() => undefined}
      />
      <ProjectList
        projects={projects}
        clients={clients}
        onEdit={setEditing}
        onCancelProject={handleCancelProject}
        onDelete={handleDelete}
        onMarkReceived={handleMarkReceived}
        deletingId={deletingId}
        highlightedProjectId={highlightedProjectId}
      />
      <EditProjectModal
        clients={clients}
        project={editing}
        open={!!editing}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />
    </div>
  )
}

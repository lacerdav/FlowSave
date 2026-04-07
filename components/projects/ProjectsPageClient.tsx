'use client'

import { useState } from 'react'
import { ProjectForm } from './ProjectForm'
import { ProjectList } from './ProjectList'
import type { Client, Project } from '@/types'

interface Props {
  initialProjects: Project[]
  clients: Pick<Client, 'id' | 'name' | 'currency'>[]
}

export function ProjectsPageClient({ initialProjects, clients }: Props) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [editing, setEditing] = useState<Project | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleSave(
    values: {
      name: string
      client_id: string | null
      expected_amount: number
      expected_date: string
      status: string
    },
    editingId: string | null
  ) {
    if (editingId) {
      // Update
      const res = await fetch(`/api/projects/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = await res.json() as Project & { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to update project.')
      setProjects(prev => prev.map(p => p.id === editingId ? json : p))
      setEditing(null)
    } else {
      // Create
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = await res.json() as Project & { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to add project.')
      // Insert sorted by expected_date ascending
      setProjects(prev => {
        const next = [...prev, json]
        return next.sort((a, b) => a.expected_date.localeCompare(b.expected_date))
      })
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

  return (
    <div className="space-y-6">
      <ProjectForm
        clients={clients}
        editing={editing}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />
      <ProjectList
        projects={projects}
        clients={clients}
        onEdit={setEditing}
        onDelete={handleDelete}
        deletingId={deletingId}
      />
    </div>
  )
}

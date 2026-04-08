'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ProjectForm } from './ProjectForm'
import type { Client, Project, ProjectStatus, ProjectSubStatus } from '@/types'

interface Props {
  clients: Pick<Client, 'id' | 'name' | 'currency'>[]
  project: Project | null
  open: boolean
  onClose: () => void
  onSave: (
    values: {
      name: string
      client_id: string | null
      expected_amount: number | null
      expected_date: string | null
      status: ProjectStatus
      sub_status: ProjectSubStatus | null
    },
    editingId: string | null
  ) => Promise<void>
}

export function EditProjectModal({ clients, project, open, onClose, onSave }: Props) {
  if (!project) return null

  return (
    <Dialog open={open} onOpenChange={nextOpen => !nextOpen && onClose()}>
      <DialogContent
        className="sm:max-w-[500px]"
        style={{
          background: 'linear-gradient(180deg, rgba(15, 20, 45, 0.98) 0%, rgba(9, 13, 31, 0.96) 100%)',
          border: '1px solid rgba(148, 174, 252, 0.20)',
          boxShadow: '0 32px 80px rgba(2, 6, 20, 0.56), 0 0 40px rgba(50, 78, 168, 0.14)',
        }}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="dialog-title-premium">
            Edit project
          </DialogTitle>
          <p className="dialog-subtitle">
            Refine the expected amount, timing, or status without leaving the project list.
          </p>
        </DialogHeader>

        <ProjectForm
          clients={clients}
          editing={project}
          onSave={onSave}
          onCancel={onClose}
          surface="none"
          showHeader={false}
        />
      </DialogContent>
    </Dialog>
  )
}

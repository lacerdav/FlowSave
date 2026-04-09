'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ProjectForm } from './ProjectForm'
import type { Client, ProjectStatus, ProjectSubStatus } from '@/types'

interface Props {
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
  clients: Pick<Client, 'id' | 'name' | 'currency'>[]
}

function getStatusGlow(status: ProjectStatus, subStatus: ProjectSubStatus | null): { border: string; glow: string } {
  if (status === 'confirmed') {
    return {
      border: 'rgba(34,216,122,0.35)',
      glow: '0 32px 80px rgba(2, 6, 20, 0.56), 0 0 40px rgba(50, 78, 168, 0.10), 0 0 28px rgba(34,216,122,0.22)',
    }
  }
  if (status === 'pending' && subStatus === 'prospecting') {
    return {
      border: 'rgba(167,139,250,0.35)',
      glow: '0 32px 80px rgba(2, 6, 20, 0.56), 0 0 40px rgba(50, 78, 168, 0.10), 0 0 28px rgba(167,139,250,0.22)',
    }
  }
  // pending + negotiating (or no sub_status) = amber
  return {
    border: 'rgba(245,166,35,0.35)',
    glow: '0 32px 80px rgba(2, 6, 20, 0.56), 0 0 40px rgba(50, 78, 168, 0.10), 0 0 28px rgba(245,166,35,0.22)',
  }
}

export function AddProjectModal({ open, onClose, onSave, clients }: Props) {
  const [modalStatus, setModalStatus] = useState<ProjectStatus>('pending')
  const [modalSubStatus, setModalSubStatus] = useState<ProjectSubStatus | null>('prospecting')

  const { border, glow } = getStatusGlow(modalStatus, modalSubStatus)

  return (
    <Dialog open={open} onOpenChange={nextOpen => !nextOpen && onClose()}>
      <DialogContent
        className="sm:max-w-[500px]"
        style={{
          background: 'linear-gradient(180deg, rgba(15, 20, 45, 0.98) 0%, rgba(9, 13, 31, 0.96) 100%)',
          border: `1px solid ${border}`,
          boxShadow: glow,
          transition: 'box-shadow 350ms ease, border-color 350ms ease',
        }}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="dialog-title-premium">
            Add a Project
          </DialogTitle>
          <p className="dialog-subtitle">
            Track a new deal, client project, or income opportunity.
          </p>
        </DialogHeader>

        <ProjectForm
          clients={clients}
          editing={null}
          onSave={onSave}
          onCancel={onClose}
          surface="none"
          showHeader={false}
          onStatusChange={(status, subStatus) => {
            setModalStatus(status)
            setModalSubStatus(subStatus)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

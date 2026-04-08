'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ProjectForm } from './ProjectForm'
import type { Client, EditableProjectStatus, Project, ProjectSubStatus } from '@/types'

interface Props {
  open: boolean
  clients: Pick<Client, 'id' | 'name' | 'currency'>[]
  initialValues: {
    client_id: string | null
    expected_amount: string
    expected_date: string
    status: EditableProjectStatus
  }
  onClose: () => void
  onCreate: (values: {
    name: string
    client_id: string | null
    expected_amount: number | null
    expected_date: string | null
    status: EditableProjectStatus
    sub_status: ProjectSubStatus | null
  }) => Promise<Project>
}

export function CreateProjectFromPaymentModal({
  open,
  clients,
  initialValues,
  onClose,
  onCreate,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={nextOpen => !nextOpen && onClose()}>
      <DialogContent
        className="sm:max-w-[520px]"
        style={{
          background: 'linear-gradient(180deg, rgba(15, 20, 45, 0.98) 0%, rgba(9, 13, 31, 0.96) 100%)',
          border: '1px solid rgba(148, 174, 252, 0.20)',
          boxShadow: '0 32px 80px rgba(2, 6, 20, 0.56), 0 0 40px rgba(50, 78, 168, 0.14)',
        }}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="dialog-title-premium">
            Create and link project
          </DialogTitle>
          <p className="dialog-subtitle">
            Add a project without leaving the payment flow, then link this payment to it immediately.
          </p>
        </DialogHeader>

        <ProjectForm
          clients={clients}
          editing={null}
          onSave={async values => {
            await onCreate({
              name: values.name,
              client_id: values.client_id,
              expected_amount: values.expected_amount,
              expected_date: values.expected_date,
              status: values.status as EditableProjectStatus,
              sub_status: values.sub_status,
            })
          }}
          onCancel={onClose}
          surface="none"
          showHeader={false}
          initialValues={initialValues}
          submitLabel="Create and link"
        />
      </DialogContent>
    </Dialog>
  )
}

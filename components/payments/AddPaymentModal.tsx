'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PaymentForm } from './PaymentForm'
import type { Client, PaymentCreateResponse, Project, ScheduleEntryWithContext } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (result: PaymentCreateResponse) => void
  onProjectAdd: (project: Project) => void
  clients: Pick<Client, 'id' | 'name' | 'currency'>[]
  projects: Project[]
  scheduleEntries: ScheduleEntryWithContext[]
}

export function AddPaymentModal({ open, onClose, onAdd, onProjectAdd, clients, projects, scheduleEntries }: Props) {
  return (
    <Dialog open={open} onOpenChange={nextOpen => !nextOpen && onClose()}>
      <DialogContent
        className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, rgba(15, 20, 45, 0.98) 0%, rgba(9, 13, 31, 0.96) 100%)',
          border: '1px solid rgba(148, 174, 252, 0.20)',
          boxShadow: '0 32px 80px rgba(2, 6, 20, 0.56), 0 0 40px rgba(50, 78, 168, 0.14)',
        }}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="dialog-title-premium">
            Record a Payment
          </DialogTitle>
          <p className="dialog-subtitle">
            Log money you have already received.
          </p>
        </DialogHeader>

        <PaymentForm
          clients={clients}
          projects={projects}
          scheduleEntries={scheduleEntries}
          surface="none"
          showHeader={false}
          onAdd={(result) => { onAdd(result); onClose() }}
          onProjectAdd={onProjectAdd}
        />
      </DialogContent>
    </Dialog>
  )
}

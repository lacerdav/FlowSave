'use client'

import { useState } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { MoneyInput } from '@/components/ui/money-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  normalizeProjectStatus,
  normalizeProjectSubStatus,
} from '@/types'
import type { Client, EditableProjectStatus, Project, ProjectStatus, ProjectSubStatus } from '@/types'

const projectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required'),
  client_id: z.string().nullable(),
  status: z.enum(['pending', 'confirmed', 'received', 'cancelled'] as const),
  sub_status: z.enum(['prospecting', 'negotiating']).nullable(),
  expected_amount: z.number().nullable(),
  expected_date: z.string().nullable(),
}).superRefine((data, ctx) => {
  if (data.status === 'confirmed') {
    if (data.expected_amount === null || isNaN(data.expected_amount) || data.expected_amount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expected_amount'],
        message: 'Required',
      })
    }
    if (!data.expected_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expected_date'],
        message: 'Required',
      })
    }
  }
})

type ProjectFormValues = z.infer<typeof projectSchema>

interface Props {
  clients: Pick<Client, 'id' | 'name' | 'currency'>[]
  editing: Project | null
  onSave: (
    values: Omit<ProjectFormValues, 'expected_amount' | 'expected_date'> & {
      expected_amount: number | null
      expected_date: string | null
    },
    editingId: string | null
  ) => Promise<void>
  onCancel: () => void
  surface?: 'panel' | 'none'
  showHeader?: boolean
  initialValues?: Partial<ProjectFormValues>
  submitLabel?: string
  title?: string
  description?: string
  allowStateEditing?: boolean
  onStatusChange?: (status: ProjectStatus, subStatus: ProjectSubStatus | null) => void
}

const STATUS_OPTIONS: { value: EditableProjectStatus; label: string }[] = [
  { value: 'pending',   label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
]

const SUB_STATUS_OPTIONS: { value: ProjectSubStatus; label: string }[] = [
  { value: 'prospecting', label: 'Prospecting' },
  { value: 'negotiating', label: 'Negotiating' },
]

export function ProjectForm({
  clients,
  editing,
  onSave,
  onCancel,
  surface = 'panel',
  showHeader = true,
  initialValues,
  submitLabel,
  title,
  description,
  allowStateEditing = true,
  onStatusChange,
}: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isEdit = editing !== null
  const defaultValues: ProjectFormValues = editing ? {
    name: editing.name,
    client_id: editing.client_id,
    expected_amount: editing.expected_amount,
    expected_date: editing.expected_date ?? '',
    status: normalizeProjectStatus(editing.status),
    sub_status: normalizeProjectSubStatus(editing.sub_status, 'prospecting'),
  } : {
    name: initialValues?.name ?? '',
    client_id: initialValues?.client_id ?? null,
    expected_amount: initialValues?.expected_amount ?? null,
    expected_date: initialValues?.expected_date ?? '',
    status: normalizeProjectStatus(initialValues?.status, 'pending'),
    sub_status: normalizeProjectSubStatus(initialValues?.sub_status, 'prospecting'),
  }

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues,
  })

  const { handleSubmit, control, setValue, formState: { isSubmitting, errors } } = form
  const status = useWatch({ control, name: 'status' })
  const clientId = useWatch({ control, name: 'client_id' })
  const selectedClient = clientId ? clients.find(c => c.id === clientId) : null

  const isPending = status === 'pending'
  const canEditStatus = allowStateEditing && (!editing || editing.status === 'pending' || editing.status === 'confirmed')
  const canEditSubStatus = allowStateEditing && !isEdit && isPending
  const requiresAmountAndDate = status === 'confirmed' || (!canEditStatus && (editing?.status === 'confirmed' || editing?.status === 'received'))

  async function onSubmit(data: ProjectFormValues) {
    setSubmitError(null)

    const finalStatus: ProjectFormValues['status'] = canEditStatus
      ? data.status
      : normalizeProjectStatus(editing?.status, data.status)
    const finalSubStatus = canEditStatus
      ? (data.status === 'pending' ? data.sub_status : null)
      : normalizeProjectSubStatus(editing?.sub_status, null)

    try {
      await onSave({
        ...data,
        status: finalStatus,
        sub_status: finalSubStatus,
      }, editing?.id ?? null)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  const nameVal = useWatch({ control, name: 'name' }) || ''
  let submitDisabled = isSubmitting || !nameVal.trim()
  
  const expectedAmount = useWatch({ control, name: 'expected_amount' })
  const expectedDate = useWatch({ control, name: 'expected_date' })

  if (requiresAmountAndDate && (!expectedAmount || !expectedDate)) {
     submitDisabled = true
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={
        surface === 'panel'
          ? 'panel-surface-soft card-interactive rounded-[18px] p-6 space-y-5'
          : 'space-y-5'
      }
    >
      {showHeader ? (
        <div className="form-card-header">
          <p className="section-label">{isEdit ? 'Edit project' : 'New project'}</p>
          <h2 className="form-card-title">
            {title ?? (isEdit ? 'Refine this project' : 'Add a future payment')}
          </h2>
          <p className="form-card-copy">
            {description ?? 'Track expected work, amount, and timing with the same polished structure used across the app.'}
          </p>
        </div>
      ) : null}

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="proj-name" className="form-label">
          Project name
          <span className="text-[var(--red)] ml-[3px] text-[11px] drop-shadow-[0_0_5px_rgba(255,91,127,0.55)]">*</span>
        </Label>
        <Input
          id="proj-name"
          placeholder="Website redesign, Branding package…"
          {...form.register('name')}
          disabled={isSubmitting}
        />
        {errors.name && <p className="text-xs text-[var(--red)]">{errors.name.message}</p>}
      </div>

      {/* Row: client + status */}
      <div className={`grid gap-3 ${canEditStatus ? 'grid-cols-1 sm:grid-cols-[1fr_10rem]' : 'grid-cols-1'}`}>
        <div className="space-y-2">
          <Label htmlFor="proj-client" className="form-label">Client (optional)</Label>
          <Controller
            control={control}
            name="client_id"
            render={({ field }) => (
              <Select
                value={field.value ?? 'none'}
                onValueChange={v => field.onChange(v === 'none' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No client">
                    {(v: string | null) => {
                      if (!v || v === 'none') return 'No client'
                      return clients.find(c => c.id === v)?.name ?? 'Unknown'
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client</SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {canEditStatus ? (
          <div className="space-y-2">
            <Label htmlFor="proj-status" className="form-label">Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={v => {
                    field.onChange(v)
                    const newSubStatus = v === 'pending' ? (form.getValues('sub_status') ?? 'prospecting') : null
                    setValue('sub_status', newSubStatus)
                    onStatusChange?.(normalizeProjectStatus(v, 'pending'), newSubStatus)
                  }}
                >
                  <SelectTrigger disabled={isSubmitting}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        ) : null}
      </div>

      {/* Sub-status row — only when pending */}
      {canEditSubStatus ? (
        <div className="space-y-2">
          <Label htmlFor="proj-sub-status" className="form-label">Stage</Label>
          <Controller
            control={control}
            name="sub_status"
            render={({ field }) => (
              <Select
                value={field.value ?? 'prospecting'}
                onValueChange={(v: string | null) => {
                  const normalizedSubStatus = normalizeProjectSubStatus(v, 'prospecting')
                  field.onChange(normalizedSubStatus)
                  onStatusChange?.(status, normalizedSubStatus)
                }}
              >
                <SelectTrigger disabled={isSubmitting}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUB_STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      ) : null}

      {/* Row: amount + date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="proj-amount" className="form-label">
            {isPending ? 'Estimated value' : 'Expected amount'}
            {isPending
              ? <span className="text-[var(--text3)] font-normal"> (optional)</span>
              : <span className="text-[var(--red)] ml-[3px] text-[11px] drop-shadow-[0_0_5px_rgba(255,91,127,0.55)]">*</span>}
          </Label>
          <Controller
            control={control}
            name="expected_amount"
            render={({ field }) => (
              <MoneyInput
                id="proj-amount"
                currency={selectedClient?.currency ?? 'USD'}
                placeholder={isPending ? 'Value TBD' : '0.00'}
                value={field.value}
                onValueChange={field.onChange}
                required={requiresAmountAndDate}
                disabled={isSubmitting}
              />
            )}
          />
          {errors.expected_amount && <p className="text-xs text-[var(--red)]">{errors.expected_amount.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="proj-date" className="form-label">
            Expected date
            {isPending
              ? <span className="text-[var(--text3)] font-normal"> (optional)</span>
              : <span className="text-[var(--red)] ml-[3px] text-[11px] drop-shadow-[0_0_5px_rgba(255,91,127,0.55)]">*</span>}
          </Label>
          <Controller
            control={control}
            name="expected_date"
            render={({ field }) => (
              <DatePicker
                id="proj-date"
                value={field.value ?? ''}
                onChange={v => field.onChange(v || null)}
                disabled={isSubmitting}
              />
            )}
          />
          {errors.expected_date && <p className="text-xs text-[var(--red)]">{errors.expected_date.message}</p>}
        </div>
      </div>

      {submitError && (
        <p className="text-xs text-[var(--red)]">{submitError}</p>
      )}

      <div className="form-cta-row" data-align={isEdit ? 'start' : 'center'}>
        <Button
          type="submit"
          disabled={submitDisabled}
          className="primary-cta-button h-11 min-w-[12rem] px-6 font-medium"
        >
          {isSubmitting
            ? isEdit ? 'Saving…' : 'Adding…'
            : submitLabel ?? (isEdit ? 'Save changes' : 'Add project')}
        </Button>

        {isEdit && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-11 px-4 text-[var(--text3)]"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

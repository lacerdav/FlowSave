import type { Database } from './supabase'

export type Plan = 'free' | 'pro'
export type Currency = 'USD' | 'BRL'
export type ProjectStatus = 'pending' | 'confirmed' | 'received' | 'cancelled'
export type EditableProjectStatus = 'pending' | 'confirmed'
export type ProjectSubStatus = 'prospecting' | 'negotiating'
export type ScheduleEntryStatus = 'scheduled' | 'received' | 'cancelled'
export type PaymentPlanType = 'one_time' | 'weekly_installments' | 'monthly_installments'

export const PLAN_VALUES = ['free', 'pro'] as const
export const PROJECT_STATUS_VALUES = ['pending', 'confirmed', 'received', 'cancelled'] as const
export const PROJECT_SUB_STATUS_VALUES = ['prospecting', 'negotiating'] as const
export const SCHEDULE_ENTRY_STATUS_VALUES = ['scheduled', 'received', 'cancelled'] as const

export type User = Omit<Database['public']['Tables']['users']['Row'], 'plan'> & {
  plan: Plan
}
export type Client = Database['public']['Tables']['clients']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type Project = Omit<Database['public']['Tables']['projects']['Row'], 'status' | 'sub_status'> & {
  status: ProjectStatus
  sub_status: ProjectSubStatus | null
}
export type Settings = Database['public']['Tables']['settings']['Row']
export type ScheduleEntry = Omit<Database['public']['Tables']['payment_schedule']['Row'], 'status'> & {
  status: ScheduleEntryStatus
}

type RawUser = Database['public']['Tables']['users']['Row']
type RawProject = Database['public']['Tables']['projects']['Row']
type RawScheduleEntry = Database['public']['Tables']['payment_schedule']['Row']

export function isPlan(value: string): value is Plan {
  return (PLAN_VALUES as readonly string[]).includes(value)
}

export function normalizePlan(value: string | null | undefined, fallback: Plan = 'free'): Plan {
  return value && isPlan(value) ? value : fallback
}

export function normalizeUser(user: RawUser): User {
  return {
    ...user,
    plan: normalizePlan(user.plan),
  }
}

export function isProjectStatus(value: string): value is ProjectStatus {
  return (PROJECT_STATUS_VALUES as readonly string[]).includes(value)
}

export function normalizeProjectStatus(
  value: string | null | undefined,
  fallback: ProjectStatus = 'pending'
): ProjectStatus {
  return value && isProjectStatus(value) ? value : fallback
}

export function isProjectSubStatus(value: string): value is ProjectSubStatus {
  return (PROJECT_SUB_STATUS_VALUES as readonly string[]).includes(value)
}

export function normalizeProjectSubStatus(
  value: string | null | undefined,
  fallback: ProjectSubStatus | null = null
): ProjectSubStatus | null {
  if (!value) return fallback
  return isProjectSubStatus(value) ? value : fallback
}

export function isScheduleEntryStatus(value: string): value is ScheduleEntryStatus {
  return (SCHEDULE_ENTRY_STATUS_VALUES as readonly string[]).includes(value)
}

export function normalizeScheduleEntryStatus(
  value: string | null | undefined,
  fallback: ScheduleEntryStatus = 'scheduled'
): ScheduleEntryStatus {
  return value && isScheduleEntryStatus(value) ? value : fallback
}

export function normalizeProject(project: RawProject): Project {
  return {
    ...project,
    status: normalizeProjectStatus(project.status),
    sub_status: normalizeProjectSubStatus(project.sub_status, null),
  }
}

export function normalizeProjects(projects: RawProject[]): Project[] {
  return projects.map(normalizeProject)
}

export function normalizeScheduleEntry(entry: RawScheduleEntry): ScheduleEntry {
  return {
    ...entry,
    status: normalizeScheduleEntryStatus(entry.status),
  }
}

export function normalizeScheduleEntries(entries: RawScheduleEntry[]): ScheduleEntry[] {
  return entries.map(normalizeScheduleEntry)
}

export interface PaymentPlanInput {
  planType: PaymentPlanType
  totalAmount: number
  currency: string
  firstDate: string
  installmentCount?: number
}

export interface ScheduleEntryWithContext extends ScheduleEntry {
  client_id: string | null
  client_name: string | null
  project_name: string
}

export interface PaymentCreateResponse {
  payment: Payment
  linked_schedule_entry_id: string | null
}

export interface ForecastMonth {
  month: Date
  projected: number
  isLean: boolean
  isEstimated: boolean
}

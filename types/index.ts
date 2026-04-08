import type { Database } from './supabase'

export type User = Database['public']['Tables']['users']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Settings = Database['public']['Tables']['settings']['Row']

export type Plan = 'free' | 'pro'
export type Currency = 'USD' | 'BRL'
export type ProjectStatus = 'pending' | 'confirmed' | 'received' | 'cancelled'
export type EditableProjectStatus = 'pending' | 'confirmed'
export type ProjectSubStatus = 'prospecting' | 'negotiating'

export type ScheduleEntry = Database['public']['Tables']['payment_schedule']['Row']
export type ScheduleEntryStatus = 'scheduled' | 'received' | 'cancelled'
export type PaymentPlanType = 'one_time' | 'weekly_installments' | 'monthly_installments'

export interface PaymentPlanInput {
  planType: PaymentPlanType
  totalAmount: number
  currency: string
  firstDate: string        // YYYY-MM-DD
  installmentCount?: number  // required for weekly/monthly
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

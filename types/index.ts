import type { Database } from './supabase'

export type User = Database['public']['Tables']['users']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Settings = Database['public']['Tables']['settings']['Row']

export type Plan = 'free' | 'pro'
export type Currency = 'USD' | 'BRL'
export type ProjectStatus = 'pending' | 'confirmed' | 'received' | 'cancelled'

export interface ForecastMonth {
  month: Date
  projected: number
  isLean: boolean
  isEstimated: boolean
}

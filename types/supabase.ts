// Hand-written Supabase types — run `npx supabase gen types typescript --local > types/supabase.ts`
// after connecting to Supabase to regenerate from the live schema.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          stripe_customer_id: string | null
          plan: 'free' | 'pro'
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          stripe_customer_id?: string | null
          plan?: 'free' | 'pro'
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          stripe_customer_id?: string | null
          plan?: 'free' | 'pro'
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          currency: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          currency?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          currency?: string
          created_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          amount: number
          currency: string
          received_at: string
          notes: string | null
          project_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          amount: number
          currency?: string
          received_at: string
          notes?: string | null
          project_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          amount?: number
          currency?: string
          received_at?: string
          notes?: string | null
          project_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          name: string
          expected_amount: number | null
          expected_date: string | null
          status: 'pending' | 'confirmed' | 'received' | 'cancelled'
          sub_status: 'prospecting' | 'negotiating' | null
          linked_payment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          name: string
          expected_amount?: number | null
          expected_date?: string | null
          status?: 'pending' | 'confirmed' | 'received' | 'cancelled'
          sub_status?: 'prospecting' | 'negotiating' | null
          linked_payment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          name?: string
          expected_amount?: number | null
          expected_date?: string | null
          status?: 'pending' | 'confirmed' | 'received' | 'cancelled'
          sub_status?: 'prospecting' | 'negotiating' | null
          linked_payment_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          user_id: string
          target_monthly_salary: number
          tax_reserve_pct: number
          survival_budget: number
          onboarding_completed: boolean
          lean_alert_sent_at: string | null
          ai_insight_cache: string | null
          ai_insight_cached_at: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          target_monthly_salary?: number
          tax_reserve_pct?: number
          survival_budget?: number
          onboarding_completed?: boolean
          lean_alert_sent_at?: string | null
          ai_insight_cache?: string | null
          ai_insight_cached_at?: string | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          target_monthly_salary?: number
          tax_reserve_pct?: number
          survival_budget?: number
          onboarding_completed?: boolean
          lean_alert_sent_at?: string | null
          ai_insight_cache?: string | null
          ai_insight_cached_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

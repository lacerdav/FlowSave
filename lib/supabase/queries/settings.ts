import { createClient } from '@/lib/supabase/server'
import type { Settings } from '@/types'

export async function getSettings(userId: string): Promise<Settings | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data
}

export async function upsertSettings(
  userId: string,
  values: {
    target_monthly_salary?: number
    tax_reserve_pct?: number
    survival_budget?: number
    onboarding_completed?: boolean
  }
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('settings')
    .upsert(
      { user_id: userId, ...values, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  return { error: error?.message ?? null }
}

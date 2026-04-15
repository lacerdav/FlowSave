import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type UsersInsert   = Database['public']['Tables']['users']['Insert']
type SettingsInsert = Database['public']['Tables']['settings']['Insert']

/**
 * POST /api/auth/setup
 *
 * Called after signUp() returns an immediate session (email confirmation disabled).
 * Accepts optional profile fields from the sign-up form body:
 *   first_name, last_name, freelance_role, primary_currency, monthly_income_goal
 *
 * - Upserts the users row (including profile fields if provided)
 * - Seeds a default settings row if one doesn't exist yet
 *   (monthly_income_goal → target_monthly_salary if provided)
 *
 * Returns { redirect: '/onboarding' | '/dashboard' }
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse optional profile fields from body
  let profile: {
    first_name?: string
    last_name?: string
    freelance_role?: string
    primary_currency?: string
    monthly_income_goal?: number
  } = {}

  try {
    const contentType = request.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      profile = await request.json() as typeof profile
    }
  } catch {
    // No body or invalid JSON — proceed without profile fields
  }

  // Upsert users row with profile fields (if provided)
  const userUpsert: UsersInsert = {
    id: user.id,
    email: user.email!,
    ...(profile.first_name       && { first_name:       profile.first_name }),
    ...(profile.last_name        && { last_name:        profile.last_name }),
    ...(profile.freelance_role   && { freelance_role:   profile.freelance_role }),
    ...(profile.primary_currency && { primary_currency: profile.primary_currency }),
  }

  await supabase
    .from('users')
    .upsert(userUpsert, { onConflict: 'id' })

  // Check whether onboarding was already completed
  const { data: settings } = await supabase
    .from('settings')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .single()

  if (!settings) {
    const settingsInsert: SettingsInsert = {
      user_id: user.id,
      ...(profile.monthly_income_goal && { target_monthly_salary: profile.monthly_income_goal }),
    }
    await supabase.from('settings').insert(settingsInsert)
    return NextResponse.json({ redirect: '/onboarding' })
  }

  return NextResponse.json({
    redirect: settings.onboarding_completed ? '/dashboard' : '/onboarding',
  })
}

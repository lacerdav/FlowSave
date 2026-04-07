import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/setup
 *
 * Called after signUp() returns an immediate session (email confirmation disabled).
 * Replicates the user-init logic that normally runs in /auth/callback:
 *   - upserts the users row
 *   - seeds a default settings row if one doesn't exist yet
 *
 * Returns { redirect: '/onboarding' | '/dashboard' } so the client knows where to go.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Ensure users row exists (FK anchor for clients / payments / settings)
  await supabase
    .from('users')
    .upsert({ id: user.id, email: user.email! }, { onConflict: 'id', ignoreDuplicates: true })

  // Check whether onboarding was already completed
  const { data: settings } = await supabase
    .from('settings')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .single()

  if (!settings) {
    await supabase.from('settings').insert({ user_id: user.id })
    return NextResponse.json({ redirect: '/onboarding' })
  }

  return NextResponse.json({
    redirect: settings.onboarding_completed ? '/dashboard' : '/onboarding',
  })
}

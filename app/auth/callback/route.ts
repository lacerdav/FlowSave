import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Supabase redirects here with ?error=... when OTP is expired/used/invalid
  const supabaseError = searchParams.get('error')
  const supabaseErrorDescription = searchParams.get('error_description')
  if (supabaseError) {
    const params = new URLSearchParams({ error: supabaseError })
    if (supabaseErrorDescription) params.set('error_description', supabaseErrorDescription)
    return NextResponse.redirect(`${origin}/login?${params}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  // Upsert user row
  await supabase
    .from('users')
    .upsert({ id: user.id, email: user.email! }, { onConflict: 'id', ignoreDuplicates: true })

  // Check settings / onboarding status
  const { data: settings } = await supabase
    .from('settings')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .single()

  if (!settings) {
    // Insert default settings row
    await supabase.from('settings').insert({ user_id: user.id })
    return NextResponse.redirect(`${origin}/onboarding`)
  }

  if (!settings.onboarding_completed) {
    return NextResponse.redirect(`${origin}/onboarding`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}

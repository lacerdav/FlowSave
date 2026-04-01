import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: settings } = await supabase
    .from('settings')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .single()

  if (settings?.onboarding_completed) {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-md mx-auto">
      <OnboardingWizard userId={user.id} />
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { normalizePlan } from '@/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('email, plan')
    .eq('id', user.id)
    .single()

  const email = userData?.email ?? user.email ?? ''
  const plan = normalizePlan(userData?.plan)

  return (
    <AppShell email={email} plan={plan}>
      {children}
    </AppShell>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/settings/SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: settings } = await supabase
    .from('settings')
    .select('target_monthly_salary, tax_reserve_pct, survival_budget')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="page-title">Settings</h1>
      <SettingsForm
        defaultValues={{
          target_monthly_salary: settings?.target_monthly_salary ?? 0,
          tax_reserve_pct: settings?.tax_reserve_pct ?? 25,
          survival_budget: settings?.survival_budget ?? 0,
        }}
      />
    </div>
  )
}

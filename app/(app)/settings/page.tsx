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
    <div className="page-shell space-y-8 pb-20">
      <div className="fade-up page-header">
        <p className="page-subtitle page-kicker">
          Preferences
        </p>
        <h1 className="page-title mt-4">Settings</h1>
      </div>
      <div className="fade-up-section page-content-stack page-content-form">
        <SettingsForm
          defaultValues={{
            target_monthly_salary: settings?.target_monthly_salary ?? 0,
            tax_reserve_pct: settings?.tax_reserve_pct ?? 25,
            survival_budget: settings?.survival_budget ?? 0,
          }}
        />
      </div>
    </div>
  )
}

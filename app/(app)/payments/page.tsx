import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PaymentsPageClient } from '@/components/payments/PaymentsPageClient'
import { normalizeProjects, normalizeScheduleEntries } from '@/types'
import type { Client, Payment } from '@/types'

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: payments }, { data: clients }, { data: projects }, { data: scheduleRows }] = await Promise.all([
    supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('received_at', { ascending: false }),
    supabase
      .from('clients')
      .select('id, name, currency')
      .eq('user_id', user.id)
      .order('name'),
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id),
    supabase
      .from('payment_schedule')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
      .order('expected_date', { ascending: true }),
  ])

  return (
    <div className="page-shell space-y-8 pb-20">
      <div className="fade-up page-header">
        <p className="page-subtitle page-kicker">
          History
        </p>
        <h1 className="page-title mt-4">Payments</h1>
      </div>
      <div className="fade-up-section page-content-stack">
        <PaymentsPageClient
          initialPayments={(payments ?? []) as Payment[]}
          clients={(clients ?? []) as Pick<Client, 'id' | 'name' | 'currency'>[]}
          projects={normalizeProjects(projects ?? [])}
          scheduleEntries={normalizeScheduleEntries(scheduleRows ?? [])}
        />
      </div>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PaymentsPageClient } from '@/components/payments/PaymentsPageClient'
import type { Client, Payment, Project } from '@/types'

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: payments }, { data: clients }, { data: projects }] = await Promise.all([
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
          projects={(projects ?? []) as Project[]}
        />
      </div>
    </div>
  )
}

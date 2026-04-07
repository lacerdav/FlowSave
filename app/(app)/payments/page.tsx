import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PaymentsPageClient } from '@/components/payments/PaymentsPageClient'
import type { Client, Payment } from '@/types'

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: payments }, { data: clients }] = await Promise.all([
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
  ])

  return (
    <div className="max-w-2xl space-y-7 pb-20">
      <div className="fade-up pt-2">
        <p className="page-subtitle page-kicker">
          History
        </p>
        <h1 className="page-title mt-4">Payments</h1>
      </div>
      <PaymentsPageClient
        initialPayments={(payments ?? []) as Payment[]}
        clients={(clients ?? []) as Pick<Client, 'id' | 'name' | 'currency'>[]}
      />
    </div>
  )
}

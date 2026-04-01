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
    <div className="max-w-2xl space-y-6">
      <h1 className="page-title">Payments</h1>
      <PaymentsPageClient
        initialPayments={(payments ?? []) as Payment[]}
        clients={(clients ?? []) as Pick<Client, 'id' | 'name' | 'currency'>[]}
      />
    </div>
  )
}

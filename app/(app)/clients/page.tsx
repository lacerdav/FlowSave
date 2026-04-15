import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientsPageClient } from '@/components/clients/ClientsPageClient'
import { enrichClients } from '@/lib/supabase/queries/clients'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: clients },
    { data: payments },
    { data: projects },
    { data: userData },
  ] = await Promise.all([
    supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('payments')
      .select('client_id, amount, received_at')
      .eq('user_id', user.id),
    supabase
      .from('projects')
      .select('client_id, status')
      .eq('user_id', user.id),
    supabase
      .from('users')
      .select('plan')
      .eq('id', user.id)
      .single(),
  ])

  const enriched = enrichClients(clients ?? [], payments ?? [], projects ?? [])

  return (
    <div className="page-shell space-y-8 pb-20">
      <div className="fade-up page-header">
        <p className="page-subtitle page-kicker">
          Manage
        </p>
        <h1 className="page-title mt-4">Clients</h1>
      </div>
      <div className="fade-up-section page-content-stack">
        <ClientsPageClient
          initialClients={enriched}
          plan={(userData?.plan ?? 'free') as 'free' | 'pro'}
        />
      </div>
    </div>
  )
}

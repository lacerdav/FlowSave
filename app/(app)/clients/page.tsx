import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientsPageClient } from '@/components/clients/ClientsPageClient'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: clients }, { data: userData }] = await Promise.all([
    supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('users')
      .select('plan')
      .eq('id', user.id)
      .single(),
  ])

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="page-title">Clients</h1>
      <ClientsPageClient
        initialClients={clients ?? []}
        plan={(userData?.plan ?? 'free') as 'free' | 'pro'}
      />
    </div>
  )
}

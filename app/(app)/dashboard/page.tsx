import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: settings }, { count: clientCount }, { count: paymentCount }] = await Promise.all([
    supabase.from('settings').select('onboarding_completed').eq('user_id', user.id).single(),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const showEmptyBanner =
    settings?.onboarding_completed &&
    ((clientCount ?? 0) === 0 || (paymentCount ?? 0) === 0)

  return (
    <div className="space-y-6">
      <h1 className="page-title">Dashboard</h1>

      {showEmptyBanner && (
        <div
          className="rounded-xl p-4 flex flex-wrap gap-3 items-center text-sm"
          style={{
            background: 'var(--amber-dim)',
            border: '1px solid var(--amber)',
            color: 'var(--amber)',
          }}
        >
          <span>Your dashboard is empty —</span>
          {(clientCount ?? 0) === 0 && (
            <Link
              href="/clients"
              className="underline font-medium"
              style={{ color: 'var(--amber)' }}
            >
              Add a client →
            </Link>
          )}
          {(paymentCount ?? 0) === 0 && (
            <Link
              href="/payments"
              className="underline font-medium"
              style={{ color: 'var(--amber)' }}
            >
              Log a payment →
            </Link>
          )}
        </div>
      )}

      <p className="text-sm" style={{ color: 'var(--text2)' }}>
        Dashboard charts and metrics will appear here in Phase 2.
      </p>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'

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
  const plan = (userData?.plan ?? 'free') as 'free' | 'pro'

  return (
    <div className="h-full" style={{ background: 'var(--bg)' }}>
      <Navbar email={email} plan={plan} />
      <Sidebar />
      <main
        className="pl-[200px] pt-14 min-h-screen"
        style={{ background: 'var(--bg)' }}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

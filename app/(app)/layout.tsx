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
    <div className="app-shell">
      <div aria-hidden className="app-shell__backdrop" />
      <Navbar email={email} plan={plan} />
      <Sidebar />
      <main className="relative z-10 pt-[108px] md:pl-[220px] md:pt-14">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-6 sm:py-6">
          {children}
        </div>
      </main>
    </div>
  )
}

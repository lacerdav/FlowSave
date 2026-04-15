import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProjectsPageClient } from '@/components/projects/ProjectsPageClient'
import { normalizeProjects, normalizeScheduleEntries } from '@/types'
import type { Client } from '@/types'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: projects }, { data: clients }, { data: scheduleRows }] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('expected_date', { ascending: true }),
    supabase
      .from('clients')
      .select('id, name, currency')
      .eq('user_id', user.id)
      .order('name'),
    supabase
      .from('payment_schedule')
      .select('*')
      .eq('user_id', user.id)
      .order('expected_date', { ascending: true }),
  ])

  return (
    <div className="page-shell space-y-8 pb-20">
      <div className="fade-up page-header">
        <p className="page-subtitle page-kicker">Pipeline</p>
        <h1 className="page-title mt-4">Projects</h1>
      </div>
      <div className="fade-up-section page-content-stack">
        <ProjectsPageClient
          initialProjects={normalizeProjects(projects ?? [])}
          initialScheduleEntries={normalizeScheduleEntries(scheduleRows ?? [])}
          clients={(clients ?? []) as Pick<Client, 'id' | 'name' | 'currency'>[]}
        />
      </div>
    </div>
  )
}

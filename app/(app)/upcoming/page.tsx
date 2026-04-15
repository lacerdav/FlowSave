import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UpcomingPageClient, type MonthGroup, type EnrichedEntry } from '@/components/upcoming/UpcomingPageClient'
import { normalizeScheduleEntries, normalizeScheduleEntryStatus } from '@/types'
import type { Client, Project, ScheduleEntry } from '@/types'

export default async function UpcomingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: scheduleRows },
    { data: projectRows },
    { data: clientRows },
  ] = await Promise.all([
    supabase
      .from('payment_schedule')
      .select('*')
      .eq('user_id', user.id)
      .order('expected_date', { ascending: true }),
    supabase
      .from('projects')
      .select('id, name, client_id')
      .eq('user_id', user.id),
    supabase
      .from('clients')
      .select('id, name')
      .eq('user_id', user.id),
  ])

  const entries: ScheduleEntry[] = normalizeScheduleEntries(scheduleRows ?? [])
  const projects = (projectRows ?? []) as Pick<Project, 'id' | 'name' | 'client_id'>[]
  const clients = (clientRows ?? []) as Pick<Client, 'id' | 'name'>[]

  const projectMap = new Map(projects.map(p => [p.id, p]))
  const clientMap = new Map(clients.map(c => [c.id, c.name]))

  // Group by YYYY-MM
  const grouped = new Map<string, EnrichedEntry[]>()

  for (const entry of entries) {
    const d = new Date(entry.expected_date + 'T00:00:00')
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

    const project = projectMap.get(entry.project_id)
    const clientName = project?.client_id ? (clientMap.get(project.client_id) ?? null) : null

    const enriched: EnrichedEntry = {
      id: entry.id,
      projectId: entry.project_id,
      projectName: project?.name ?? 'Unknown project',
      clientName,
      amount: entry.amount,
      currency: entry.currency,
      expectedDate: entry.expected_date,
      status: normalizeScheduleEntryStatus(entry.status),
      label: entry.label,
      paymentId: entry.payment_id,
    }

    const existing = grouped.get(key) ?? []
    existing.push(enriched)
    grouped.set(key, existing)
  }

  const groups: MonthGroup[] = Array.from(grouped.entries()).map(([key, groupEntries]) => {
    const [year, month] = key.split('-').map(Number)
    const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })

    const totalByCurrency = groupEntries
      .filter(e => e.status === 'scheduled')
      .reduce((map, e) => {
        map[e.currency] = (map[e.currency] ?? 0) + e.amount
        return map
      }, {} as Record<string, number>)

    return { key, monthLabel, totalByCurrency, entries: groupEntries }
  })

  return (
    <div className="page-shell space-y-8 pb-20">
      <div className="fade-up page-header">
        <p className="page-subtitle page-kicker">Revenue Schedule</p>
        <h1 className="page-title mt-4">Upcoming</h1>
      </div>
      <div className="fade-up-section page-content-stack">
        <UpcomingPageClient groups={groups} />
      </div>
    </div>
  )
}

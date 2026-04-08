import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateScheduleEntries } from '@/lib/schedule'
import { insertScheduleEntries, deleteScheduledEntriesForProject } from '@/lib/supabase/queries/schedule'
import type { PaymentPlanInput } from '@/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Ownership + status check
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, status, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (project.status !== 'confirmed') {
    return NextResponse.json(
      { error: 'Payment plans can only be created for confirmed projects' },
      { status: 400 }
    )
  }

  // Check for already-received entries — cannot regenerate over them
  const { data: receivedEntries } = await supabase
    .from('payment_schedule')
    .select('id')
    .eq('project_id', id)
    .eq('status', 'received')

  if (receivedEntries && receivedEntries.length > 0) {
    return NextResponse.json(
      { error: 'Cannot regenerate — entries already received. Edit individual entries on /upcoming.' },
      { status: 409 }
    )
  }

  const body = await request.json() as PaymentPlanInput

  // Delete existing scheduled entries for this project
  const { error: deleteError } = await deleteScheduledEntriesForProject(user.id, id)
  if (deleteError) {
    return NextResponse.json({ error: deleteError }, { status: 500 })
  }

  // Generate and insert new entries
  const generated = generateScheduleEntries(body)
  const entries = generated.map(e => ({
    project_id: id,
    amount: e.amount,
    currency: body.currency,
    expected_date: e.expected_date,
    label: e.label,
  }))

  const { data, error } = await insertScheduleEntries(user.id, entries)
  if (error) return NextResponse.json({ error }, { status: 500 })

  return NextResponse.json({ entries: data })
}

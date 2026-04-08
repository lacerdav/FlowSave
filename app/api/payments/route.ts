import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { attemptAutoLink } from '@/lib/supabase/queries/linking'
import type { Payment } from '@/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', user.id)
    .order('received_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    client_id?: string | null
    amount: number
    currency?: string
    received_at: string
    notes?: string | null
    /** Optional: manually specify a project to link — skips auto-detection */
    project_id?: string | null
    /** Optional: link directly to a schedule entry — skips auto-detection */
    schedule_entry_id?: string | null
  }

  if (!body.amount || !body.received_at) {
    return NextResponse.json({ error: 'amount and received_at are required' }, { status: 400 })
  }

  let linkedScheduleEntryId: string | null = null
  let payment: Payment

  if (body.schedule_entry_id) {
    const { data: entry, error: entryError } = await supabase
      .from('payment_schedule')
      .select('id, project_id, status, payment_id, currency')
      .eq('id', body.schedule_entry_id)
      .eq('user_id', user.id)
      .single()

    if (entryError || !entry) {
      return NextResponse.json({ error: 'Scheduled entry not found' }, { status: 404 })
    }

    if (entry.status !== 'scheduled' || entry.payment_id) {
      return NextResponse.json({ error: 'This scheduled entry is no longer available.' }, { status: 409 })
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, client_id')
      .eq('id', entry.project_id)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found for scheduled entry' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        client_id: project.client_id,
        amount: body.amount,
        currency: body.currency ?? entry.currency,
        received_at: body.received_at,
        notes: body.notes ?? null,
        project_id: entry.project_id,
      })
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Failed to create payment' }, { status: 500 })
    }

    payment = data as Payment

    const { data: updatedEntry, error: updateEntryError } = await supabase
      .from('payment_schedule')
      .update({ status: 'received', payment_id: payment.id })
      .eq('id', body.schedule_entry_id)
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
      .is('payment_id', null)
      .select('id, project_id')
      .single()

    if (updateEntryError || !updatedEntry) {
      await supabase
        .from('payments')
        .delete()
        .eq('id', payment.id)
        .eq('user_id', user.id)

      return NextResponse.json({ error: 'This scheduled entry is no longer available.' }, { status: 409 })
    }

    const { data: remaining } = await supabase
      .from('payment_schedule')
      .select('id')
      .eq('project_id', updatedEntry.project_id)
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
      .limit(1)

    if (!remaining || remaining.length === 0) {
      await supabase
        .from('projects')
        .update({ status: 'received' })
        .eq('id', updatedEntry.project_id)
        .eq('user_id', user.id)
    }

    linkedScheduleEntryId = updatedEntry.id
  } else {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        client_id: body.client_id ?? null,
        amount: body.amount,
        currency: body.currency ?? 'USD',
        received_at: body.received_at,
        notes: body.notes ?? null,
        project_id: body.project_id ?? null,
      })
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Failed to create payment' }, { status: 500 })
    }

    payment = data as Payment
  }

  if (!body.schedule_entry_id && body.project_id) {
    // Manually specified project — link it directly
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', body.project_id)
      .eq('user_id', user.id)
      .single()

    if (project && !project.linked_payment_id && project.status !== 'received') {
      await supabase
        .from('projects')
        .update({ status: 'received', linked_payment_id: payment.id })
        .eq('id', project.id)
        .eq('user_id', user.id)
    }
  } else if (!body.schedule_entry_id) {
    // Attempt automatic matching
    payment = await attemptAutoLink(supabase, user.id, payment)
  }

  return NextResponse.json({
    payment,
    linked_schedule_entry_id: linkedScheduleEntryId,
  })
}

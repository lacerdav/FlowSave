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
  }

  if (!body.amount || !body.received_at) {
    return NextResponse.json({ error: 'amount and received_at are required' }, { status: 400 })
  }

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let payment = data as Payment

  // If a project_id was explicitly provided, link it directly
  if (body.project_id) {
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
  } else {
    // Attempt automatic matching
    payment = await attemptAutoLink(supabase, user.id, payment)
  }

  return NextResponse.json(payment)
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ScheduleEntryStatus } from '@/types'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json() as {
    status?: ScheduleEntryStatus
    expected_date?: string
    amount?: number
    label?: string | null
  }

  const { data, error } = await supabase
    .from('payment_schedule')
    .update(body)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Only allow deletion of scheduled (not received) entries
  const { data: entry } = await supabase
    .from('payment_schedule')
    .select('status, payment_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (entry.status === 'received' && entry.payment_id) {
    return NextResponse.json({ error: 'Cannot delete a received entry' }, { status: 409 })
  }

  const { error } = await supabase
    .from('payment_schedule')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

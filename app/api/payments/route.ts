import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

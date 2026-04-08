import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Payment, Project } from '@/types'

/**
 * POST /api/projects/[id]/receive
 *
 * Creates a payment from the project's expected values, then links both.
 * The caller may override amount, currency, received_at, and notes.
 *
 * Returns { project, payment }.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Load project — must belong to this user
  const { data: project, error: projectErr } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (projectErr || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (project.status === 'received') {
    return NextResponse.json({ error: 'Project already received' }, { status: 409 })
  }

  if (project.linked_payment_id) {
    return NextResponse.json({ error: 'Project already linked to a payment' }, { status: 409 })
  }

  const body = await request.json().catch(() => ({})) as {
    amount?: number
    currency?: string
    received_at?: string
    notes?: string | null
  }

  const today = new Date().toISOString().split('T')[0]

  // Create the payment using project values as defaults
  const { data: payment, error: paymentErr } = await supabase
    .from('payments')
    .insert({
      user_id: user.id,
      client_id: project.client_id,
      amount: body.amount ?? project.expected_amount ?? 0,
      currency: body.currency ?? 'USD',
      received_at: body.received_at ?? today,
      notes: body.notes ?? null,
      project_id: project.id,
    })
    .select()
    .single()

  if (paymentErr || !payment) {
    return NextResponse.json({ error: paymentErr?.message ?? 'Failed to create payment' }, { status: 500 })
  }

  // Update project
  const { data: updatedProject, error: updateErr } = await supabase
    .from('projects')
    .update({ status: 'received', linked_payment_id: payment.id })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (updateErr || !updatedProject) {
    return NextResponse.json({ error: updateErr?.message ?? 'Failed to update project' }, { status: 500 })
  }

  return NextResponse.json({
    project: updatedProject as Project,
    payment: payment as Payment,
  })
}

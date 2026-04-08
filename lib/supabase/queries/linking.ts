import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type { Payment, Project } from '@/types'

type Supabase = SupabaseClient<Database>

/** How many days either side of received_at to consider a match */
const DATE_WINDOW_DAYS = 30
/** Maximum relative difference in amount to consider a match */
const AMOUNT_TOLERANCE = 0.05

function daysDiff(a: string, b: string): number {
  const msA = new Date(a + 'T00:00:00').getTime()
  const msB = new Date(b + 'T00:00:00').getTime()
  return Math.abs(msA - msB) / (1000 * 60 * 60 * 24)
}

/**
 * After a payment is inserted, attempt to find a matching project and link them.
 * Matching criteria:
 *  - same user_id
 *  - same client_id (both null or same value)
 *  - status is 'pending' or 'confirmed' (not yet received or cancelled)
 *  - expected_amount within ±5% of payment amount
 *  - expected_date within ±30 days of received_at
 *
 * If multiple candidates match, pick the one with the closest expected_date.
 * Returns the updated payment (with project_id set) or the original payment on no match.
 */
export async function attemptAutoLink(
  supabase: Supabase,
  userId: string,
  payment: Payment
): Promise<Payment> {
  // Fetch candidate projects for this user + client
  const { data: candidates } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['pending', 'confirmed'])
    .is('linked_payment_id', null)

  if (!candidates || candidates.length === 0) return payment

  // Filter by client_id and tolerance windows
  const matching = (candidates as Project[]).filter(p => {
    // client_id must match exactly (both null or same value)
    if (p.client_id !== payment.client_id) return false

    // Skip projects with no amount or date set yet
    if (p.expected_amount == null || p.expected_date == null) return false

    // Amount within ±5%
    const ratio = Math.abs(p.expected_amount - payment.amount) / payment.amount
    if (ratio > AMOUNT_TOLERANCE) return false

    // Date within ±30 days
    if (daysDiff(p.expected_date, payment.received_at) > DATE_WINDOW_DAYS) return false

    return true
  })

  if (matching.length === 0) return payment

  // Pick closest expected_date (only projects with non-null date remain after filter above)
  const best = matching.reduce((closest, p) => {
    return daysDiff(p.expected_date!, payment.received_at) <
      daysDiff(closest.expected_date!, payment.received_at)
      ? p
      : closest
  })

  return linkPaymentToProject(supabase, payment, best)
}

/**
 * Link a payment and project together:
 *  - sets payment.project_id = project.id
 *  - sets project.linked_payment_id = payment.id
 *  - sets project.status = 'received'
 * Returns the updated payment.
 */
export async function linkPaymentToProject(
  supabase: Supabase,
  payment: Payment,
  project: Project
): Promise<Payment> {
  // Guard: project already linked
  if (project.linked_payment_id) return payment

  // Update project
  await supabase
    .from('projects')
    .update({ status: 'received', linked_payment_id: payment.id })
    .eq('id', project.id)
    .eq('user_id', project.user_id)

  // Update payment
  const { data: updated } = await supabase
    .from('payments')
    .update({ project_id: project.id })
    .eq('id', payment.id)
    .eq('user_id', payment.user_id)
    .select()
    .single()

  return updated ?? { ...payment, project_id: project.id }
}

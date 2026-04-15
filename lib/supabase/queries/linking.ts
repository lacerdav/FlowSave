import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { normalizeProjects, normalizeScheduleEntries } from '@/types'
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
 * After a payment is inserted, attempt to find a matching schedule entry or project.
 *
 * Phase 1 — Schedule entries:
 *   Find a 'scheduled' entry matching client_id, amount (±5%), and date (±30 days).
 *   Mark it received, set payment.project_id. If all entries for the project are
 *   now non-scheduled, flip project.status = 'received'.
 *
 * Phase 2 — Project fallback (existing logic):
 *   If no schedule entry matched, match against pending/confirmed projects directly.
 */
export async function attemptAutoLink(
  supabase: Supabase,
  userId: string,
  payment: Payment
): Promise<Payment> {
  // ── Phase 1: match against payment_schedule ──────────────────────────────
  const [{ data: scheduleRows }, { data: projectRows }] = await Promise.all([
    supabase
      .from('payment_schedule')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'scheduled'),
    supabase
      .from('projects')
      .select('id, client_id')
      .eq('user_id', userId),
  ])

  if (scheduleRows && scheduleRows.length > 0) {
    const projectClientMap = new Map<string, string | null>(
      (projectRows ?? []).map(p => [p.id, p.client_id])
    )

    // Filter candidates
    const matchingEntries = normalizeScheduleEntries(scheduleRows)
      .filter(e => {
        const clientId = projectClientMap.get(e.project_id) ?? null
        if (clientId !== payment.client_id) return false
        const ratio = Math.abs(e.amount - payment.amount) / payment.amount
        if (ratio > AMOUNT_TOLERANCE) return false
        if (daysDiff(e.expected_date, payment.received_at) > DATE_WINDOW_DAYS) return false
        return true
      })

    if (matchingEntries.length > 0) {
      // Pick closest expected_date
      const best = matchingEntries.reduce((closest, e) =>
        daysDiff(e.expected_date, payment.received_at) <
        daysDiff(closest.expected_date, payment.received_at)
          ? e
          : closest
      )

      // Mark entry received
      await supabase
        .from('payment_schedule')
        .update({ status: 'received', payment_id: payment.id })
        .eq('id', best.id)
        .eq('user_id', userId)

      // Check if all entries for this project are now non-scheduled
      const { data: remaining } = await supabase
        .from('payment_schedule')
        .select('id')
        .eq('project_id', best.project_id)
        .eq('status', 'scheduled')
        .neq('id', best.id)

      if (!remaining || remaining.length === 0) {
        await supabase
          .from('projects')
          .update({ status: 'received' })
          .eq('id', best.project_id)
          .eq('user_id', userId)
      }

      // Set payment.project_id
      const { data: updated } = await supabase
        .from('payments')
        .update({ project_id: best.project_id })
        .eq('id', payment.id)
        .eq('user_id', userId)
        .select()
        .single()

      return updated ?? { ...payment, project_id: best.project_id }
    }
  }

  // ── Phase 2: project-level fallback ──────────────────────────────────────
  const { data: candidates } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['pending', 'confirmed'])
    .is('linked_payment_id', null)

  if (!candidates || candidates.length === 0) return payment

  const matching = normalizeProjects(candidates).filter(p => {
    if (p.client_id !== payment.client_id) return false
    if (p.expected_amount == null || p.expected_date == null) return false
    const ratio = Math.abs(p.expected_amount - payment.amount) / payment.amount
    if (ratio > AMOUNT_TOLERANCE) return false
    if (daysDiff(p.expected_date, payment.received_at) > DATE_WINDOW_DAYS) return false
    return true
  })

  if (matching.length === 0) return payment

  const best = matching.reduce((closest, p) =>
    daysDiff(p.expected_date!, payment.received_at) <
    daysDiff(closest.expected_date!, payment.received_at)
      ? p
      : closest
  )

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

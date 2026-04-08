import { createClient } from '@/lib/supabase/server'
import type { ScheduleEntry } from '@/types'

/** All schedule entries for a user, ordered by expected_date ascending. */
export async function getScheduleEntries(userId: string): Promise<ScheduleEntry[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('payment_schedule')
    .select('*')
    .eq('user_id', userId)
    .order('expected_date', { ascending: true })
  return (data ?? []) as ScheduleEntry[]
}

/** Schedule entries for a specific project, ordered by expected_date ascending. */
export async function getScheduleEntriesByProject(
  userId: string,
  projectId: string,
): Promise<ScheduleEntry[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('payment_schedule')
    .select('*')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .order('expected_date', { ascending: true })
  return (data ?? []) as ScheduleEntry[]
}

/** Bulk insert schedule entries. Returns the created rows. */
export async function insertScheduleEntries(
  userId: string,
  entries: Array<{
    project_id: string
    amount: number
    currency: string
    expected_date: string
    label?: string | null
  }>,
): Promise<{ data: ScheduleEntry[] | null; error: string | null }> {
  const supabase = await createClient()
  const rows = entries.map(e => ({ user_id: userId, ...e }))
  const { data, error } = await supabase
    .from('payment_schedule')
    .insert(rows)
    .select()
  if (error) return { data: null, error: error.message }
  return { data: (data ?? []) as ScheduleEntry[], error: null }
}

/**
 * Mark a schedule entry as received and link it to a payment.
 * Only mutates rows owned by userId.
 */
export async function markScheduleEntryReceived(
  userId: string,
  entryId: string,
  paymentId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('payment_schedule')
    .update({ status: 'received', payment_id: paymentId })
    .eq('id', entryId)
    .eq('user_id', userId)
  return { error: error?.message ?? null }
}

/** Cancel a schedule entry (status → 'cancelled'). */
export async function cancelScheduleEntry(
  userId: string,
  entryId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('payment_schedule')
    .update({ status: 'cancelled' })
    .eq('id', entryId)
    .eq('user_id', userId)
  return { error: error?.message ?? null }
}

/**
 * Delete all SCHEDULED (not received/cancelled) entries for a project.
 * Never touches received entries — they are financial records.
 */
export async function deleteScheduledEntriesForProject(
  userId: string,
  projectId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('payment_schedule')
    .delete()
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .eq('status', 'scheduled')
  return { error: error?.message ?? null }
}

import { createClient } from '@/lib/supabase/server'
import type { Payment } from '@/types'

export async function getPayments(userId: string, limit?: number): Promise<Payment[]> {
  const supabase = await createClient()
  let query = supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('received_at', { ascending: false })

  if (limit) query = query.limit(limit)

  const { data } = await query
  return data ?? []
}

export async function insertPayment(
  userId: string,
  values: {
    client_id?: string | null
    amount: number
    currency: string
    received_at: string
    notes?: string | null
  }
): Promise<{ data: Payment | null; error: string | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .insert({ user_id: userId, ...values })
    .select()
    .single()
  return { data, error: error?.message ?? null }
}

export async function deletePayment(
  paymentId: string,
  userId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', paymentId)
    .eq('user_id', userId)
  return { error: error?.message ?? null }
}

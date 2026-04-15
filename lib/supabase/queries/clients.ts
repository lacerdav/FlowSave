import { createClient } from '@/lib/supabase/server'
import type { Client, Payment, Project } from '@/types'

export interface ClientWithStats extends Client {
  total_received: number
  last_payment_date: string | null
  // active = status IN ('confirmed', 'pending')
  active_project_count: number
}

/**
 * Enriches a client list with aggregated stats derived from payments and projects.
 * Runs entirely in JS — no DB view or RPC needed given freelancer data volumes.
 */
export function enrichClients(
  clients: Client[],
  payments: Pick<Payment, 'client_id' | 'amount' | 'received_at'>[],
  projects: Pick<Project, 'client_id' | 'status'>[],
): ClientWithStats[] {
  return clients.map((client) => {
    const clientPayments = payments.filter((p) => p.client_id === client.id)
    const total_received = clientPayments.reduce((sum, p) => sum + p.amount, 0)
    const last_payment_date = clientPayments.length > 0
      ? clientPayments
          .map((p) => p.received_at)
          .sort((a, b) => b.localeCompare(a))[0]
      : null

    const active_project_count = projects.filter(
      (p) => p.client_id === client.id && (p.status === 'confirmed' || p.status === 'pending')
    ).length

    return { ...client, total_received, last_payment_date, active_project_count }
  })
}

export async function getClients(userId: string): Promise<Client[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getClientCount(userId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  return count ?? 0
}

export async function insertClient(
  userId: string,
  name: string,
  currency: string,
  plan: 'free' | 'pro'
): Promise<{ data: Client | null; error: string | null }> {
  const supabase = await createClient()

  // Double-gate: server-side check for free plan
  if (plan === 'free') {
    const count = await getClientCount(userId)
    if (count >= 2) {
      return { data: null, error: 'Free plan limited to 2 clients. Upgrade to Pro.' }
    }
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({ user_id: userId, name, currency })
    .select()
    .single()

  return { data, error: error?.message ?? null }
}

export async function deleteClient(
  clientId: string,
  userId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)
    .eq('user_id', userId)
  return { error: error?.message ?? null }
}

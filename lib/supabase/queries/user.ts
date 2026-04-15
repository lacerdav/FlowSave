import { createClient } from '@/lib/supabase/server'
import { normalizeUser } from '@/types'
import type { User } from '@/types'

export async function getUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return data ? normalizeUser(data) : null
}

export async function upsertUser(id: string, email: string): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('users')
    .upsert({ id, email }, { onConflict: 'id', ignoreDuplicates: true })
}

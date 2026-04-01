import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/types'

export async function getProjects(userId: string): Promise<Project[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('expected_date', { ascending: true })
  return data ?? []
}

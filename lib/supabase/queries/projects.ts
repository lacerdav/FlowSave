import { createClient } from '@/lib/supabase/server'
import { normalizeProject, normalizeProjects } from '@/types'
import type { Project, ProjectStatus } from '@/types'

export async function getProjects(userId: string): Promise<Project[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('expected_date', { ascending: true })
  return normalizeProjects(data ?? [])
}

export async function createProject(
  userId: string,
  values: {
    client_id?: string | null
    name: string
    expected_amount: number
    expected_date: string
    status?: ProjectStatus
  }
): Promise<{ data: Project | null; error: string | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: userId, ...values })
    .select()
    .single()
  return { data: data ? normalizeProject(data) : null, error: error?.message ?? null }
}

export async function updateProject(
  projectId: string,
  userId: string,
  values: {
    client_id?: string | null
    name?: string
    expected_amount?: number
    expected_date?: string
    status?: ProjectStatus
  }
): Promise<{ data: Project | null; error: string | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .update(values)
    .eq('id', projectId)
    .eq('user_id', userId)
    .select()
    .single()
  return { data: data ? normalizeProject(data) : null, error: error?.message ?? null }
}

export async function deleteProject(
  projectId: string,
  userId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId)
  return { error: error?.message ?? null }
}

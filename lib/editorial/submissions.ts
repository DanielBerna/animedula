import { getSupabaseAdmin, isSupabaseConfigured } from '../supabaseAdmin'
import { createClient, isSupabaseAuthConfigured } from '../supabase/server'

export type SubmissionItem = {
  id: string
  kind: string
  mal_id: number
  field: string
  body: string
  status: string
  created_at: string
  author_name: string
  author_username: string | null
}

export async function listPendingSubmissions(limit = 50): Promise<SubmissionItem[]> {
  if (!isSupabaseAuthConfigured()) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('community_submissions')
    .select('id, kind, mal_id, field, body, status, created_at, profiles(display_name, username)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw error

  return (data || []).map((row) => {
    const profile = row.profiles as { display_name?: string | null; username?: string | null } | null
    return {
      id: row.id,
      kind: row.kind,
      mal_id: row.mal_id,
      field: row.field,
      body: row.body,
      status: row.status,
      created_at: row.created_at,
      author_name: profile?.display_name || 'Colaborador',
      author_username: profile?.username ?? null,
    }
  })
}

export async function setSubmissionStatus(id: string, status: 'accepted' | 'rejected') {
  if (!isSupabaseConfigured()) throw new Error('Supabase no configurado')

  const admin = getSupabaseAdmin()
  const { error } = await admin.from('community_submissions').update({ status }).eq('id', id)
  if (error) throw error
}

import { getSupabaseAdmin, isSupabaseConfigured } from '../supabaseAdmin'

/** Publica borradores cuya fecha programada ya pasó (cron diario). */
export async function publishDueEditorialReviews(): Promise<{
  published: number
  ids: string[]
}> {
  if (!isSupabaseConfigured()) return { published: 0, ids: [] }

  const admin = getSupabaseAdmin()
  const now = new Date().toISOString()

  const { data: due } = await admin
    .from('editorial_reviews')
    .select('id, kind, mal_id')
    .in('status', ['draft', 'pending'])
    .not('scheduled_publish_at', 'is', null)
    .lte('scheduled_publish_at', now)
    .limit(20)

  const ids: string[] = []

  for (const row of due || []) {
    await admin
      .from('editorial_reviews')
      .update({ status: 'rejected', updated_at: now })
      .eq('kind', row.kind)
      .eq('mal_id', row.mal_id)
      .eq('status', 'published')
      .neq('id', row.id)

    const { error } = await admin
      .from('editorial_reviews')
      .update({
        status: 'published',
        published_at: now,
        updated_at: now,
      })
      .eq('id', row.id)

    if (!error) ids.push(row.id as string)
  }

  return { published: ids.length, ids }
}

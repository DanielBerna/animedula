import { getSupabaseAdmin, isSupabaseConfigured } from '../supabaseAdmin'
import type { WatchLang } from './types'
import { findMediaByMalId } from './mirrors'

export type EpisodeMirrorCoverage = {
  episode: number
  langs: WatchLang[]
  servers: string[]
}

export async function getMirrorCoverageForMal(malId: number): Promise<{
  coverage: EpisodeMirrorCoverage[]
  latEpisodes: number[]
  embedProviders: { id: string; name: string; template: string }[]
}> {
  const { getWatchProviders } = await import('./embed')
  const embedProviders = getWatchProviders().map((p) => ({
    id: p.id,
    name: p.name,
    template: p.template,
  }))

  if (!isSupabaseConfigured()) {
    return { coverage: [], latEpisodes: [], embedProviders }
  }

  const media = await findMediaByMalId(malId)
  if (!media) {
    return { coverage: [], latEpisodes: [], embedProviders }
  }

  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from('watch_episode_sources')
    .select('episode, lang, server_label')
    .eq('media_id', media.id)
    .eq('is_active', true)
    .order('episode')

  const byEp = new Map<number, { langs: Set<WatchLang>; servers: Set<string> }>()
  for (const row of data || []) {
    const ep = row.episode as number
    if (!byEp.has(ep)) byEp.set(ep, { langs: new Set(), servers: new Set() })
    const entry = byEp.get(ep)!
    entry.langs.add(row.lang as WatchLang)
    entry.servers.add(row.server_label as string)
  }

  const coverage: EpisodeMirrorCoverage[] = [...byEp.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([episode, v]) => ({
      episode,
      langs: [...v.langs],
      servers: [...v.servers],
    }))

  const latEpisodes = coverage.filter((c) => c.langs.includes('lat')).map((c) => c.episode)

  return { coverage, latEpisodes, embedProviders }
}

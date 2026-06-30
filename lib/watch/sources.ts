import { buildEmbedUrl, getWatchProviders } from './embed'
import type { EmbedPlaybackSource, MirrorSource, PlaybackSource, WatchLang } from './types'

export const WATCH_LANG_LABELS: Record<WatchLang, string> = {
  lat: 'Doblaje latino',
  sub: 'Japonés + subtítulos',
  dub: 'Doblaje inglés',
}

/** Los agregadores externos no tienen `lat`; usamos `sub` como audio de respaldo. */
export function embedLangForWatchLang(lang: WatchLang): 'sub' | 'dub' {
  if (lang === 'dub') return 'dub'
  return 'sub'
}

export function buildEmbedPlaybackSources(opts: {
  malId: number
  anilistId?: number | null
  episode: number
  lang: WatchLang
}): EmbedPlaybackSource[] {
  const providers = getWatchProviders()
  const embedLang = embedLangForWatchLang(opts.lang)
  const out: EmbedPlaybackSource[] = []

  for (const p of providers) {
    if (embedLang === 'dub' && p.dub === false) continue

    out.push({
      id: `embed-${p.id}-mal`,
      serverLabel: p.name,
      sourceType: 'iframe',
      url: buildEmbedUrl(p, opts.malId, opts.episode, embedLang, 'mal'),
      lang: opts.lang,
      tier: 'embed',
      idKind: 'mal',
    })

    if (opts.anilistId && p.anilistTemplate) {
      out.push({
        id: `embed-${p.id}-ani`,
        serverLabel: `${p.name} · AniList`,
        sourceType: 'iframe',
        url: buildEmbedUrl(p, opts.anilistId, opts.episode, embedLang, 'anilist'),
        lang: opts.lang,
        tier: 'embed',
        idKind: 'anilist',
      })
    }
  }

  return out
}

export function mergePlaybackSources(
  mirrors: MirrorSource[],
  embeds: EmbedPlaybackSource[],
): PlaybackSource[] {
  return [...mirrors, ...embeds]
}

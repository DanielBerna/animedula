import { buildEmbedUrl, getWatchProviders } from './embed'
import { appendSubtitleParams, buildPublicSubtitleUrl } from './subtitles-url'
import type { EmbedPlaybackSource, MirrorSource, PlaybackSource, WatchLang } from './types'

export const WATCH_LANG_LABELS: Record<WatchLang, string> = {
  lat: 'Doblaje latino',
  sub: 'Japonés + subs ES',
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
  kitsuId?: number | null
  episode: number
  lang: WatchLang
  siteOrigin?: string
}): EmbedPlaybackSource[] {
  const providers = getWatchProviders()
  const embedLang = embedLangForWatchLang(opts.lang)
  const out: EmbedPlaybackSource[] = []

  const subtitleUrl =
    embedLang === 'sub' && opts.siteOrigin
      ? buildPublicSubtitleUrl(opts.siteOrigin, opts.malId, opts.episode)
      : null

  const idVariants: { kind: 'mal' | 'anilist' | 'kitsu'; id: number; suffix: string }[] = [
    { kind: 'mal', id: opts.malId, suffix: 'mal' },
  ]
  if (opts.anilistId) idVariants.push({ kind: 'anilist', id: opts.anilistId, suffix: 'ani' })
  if (opts.kitsuId) idVariants.push({ kind: 'kitsu', id: opts.kitsuId, suffix: 'kitsu' })

  for (const p of providers) {
    if (embedLang === 'dub' && p.dub === false) continue

    const seen = new Set<string>()
    for (const variant of idVariants) {
      let url = buildEmbedUrl(p, variant.id, opts.episode, embedLang, variant.kind)
      if (!url || seen.has(url)) continue

      if (subtitleUrl && p.id === 'vidlink' && variant.kind === 'mal') {
        url = appendSubtitleParams(url, subtitleUrl)
      }

      seen.add(url)

      const needsAnilistOnly = !p.template.includes('{malId}') && variant.kind !== 'anilist'
      const needsKitsuOnly = p.kitsuTemplate && variant.kind !== 'kitsu'
      if (needsAnilistOnly && variant.kind === 'mal') continue
      if (p.id === 'vidnest' && variant.kind === 'mal') continue

      const labelSuffix =
        variant.kind === 'mal' ? '' : variant.kind === 'anilist' ? ' · AniList' : ' · Kitsu'

      out.push({
        id: `embed-${p.id}-${variant.suffix}`,
        serverLabel: `${p.name}${labelSuffix}`,
        sourceType: 'iframe',
        url,
        lang: opts.lang,
        tier: 'embed',
        idKind: variant.kind,
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

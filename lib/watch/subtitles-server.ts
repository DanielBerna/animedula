import { inflateRawSync } from 'node:zlib'
import { fetchJikan } from '../jikan'

const OPENSUBTITLES_API = 'https://api.opensubtitles.com/api/v1'
const CACHE_TTL_MS = 86_400_000

type CacheEntry = { vtt: string; expires: number }
const memCache = new Map<string, CacheEntry>()

function cacheKey(malId: number, episode: number) {
  return `${malId}:${episode}`
}

function opensubtitlesConfigured(): boolean {
  return Boolean(process.env.OPENSUBTITLES_API_KEY?.trim())
}

function opensubtitlesHeaders(): Record<string, string> | null {
  const key = process.env.OPENSUBTITLES_API_KEY?.trim()
  if (!key) return null
  return {
    'Api-Key': key,
    'User-Agent': process.env.OPENSUBTITLES_USER_AGENT || 'Animedula 1.0',
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

function srtToVtt(srt: string): string {
  const normalized = srt.replace(/\r\n/g, '\n').trim()
  if (normalized.startsWith('WEBVTT')) return normalized

  const blocks = normalized.split(/\n\n+/)
  let vtt = 'WEBVTT\n\n'

  for (const block of blocks) {
    const lines = block.split('\n').filter(Boolean)
    if (!lines.length) continue
    let i = 0
    if (/^\d+$/.test(lines[0].trim())) i = 1
    const timing = lines[i]?.replace(/,/g, '.')
    const text = lines.slice(i + 1).join('\n')
    if (!timing?.includes('-->') || !text) continue
    vtt += `${timing}\n${text}\n\n`
  }

  return vtt
}

function extractTextFromZip(buffer: Buffer): string | null {
  if (buffer.length < 30 || buffer.readUInt32LE(0) !== 0x04034b50) return null

  const compression = buffer.readUInt16LE(8)
  const compressedSize = buffer.readUInt32LE(18)
  const nameLen = buffer.readUInt16LE(26)
  const extraLen = buffer.readUInt16LE(28)
  const dataStart = 30 + nameLen + extraLen
  const payload = buffer.subarray(dataStart, dataStart + compressedSize)

  if (compression === 0) return payload.toString('utf8')

  if (compression === 8) {
    try {
      return inflateRawSync(payload).toString('utf8')
    } catch {
      return null
    }
  }

  return null
}

async function downloadSubtitleFile(fileId: number): Promise<string | null> {
  const headers = opensubtitlesHeaders()
  if (!headers) return null

  const res = await fetch(`${OPENSUBTITLES_API}/download`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ file_id: fileId }),
  })

  if (!res.ok) return null

  const json = (await res.json()) as { link?: string }
  if (!json.link) return null

  const fileRes = await fetch(json.link)
  if (!fileRes.ok) return null

  const buf = Buffer.from(await fileRes.arrayBuffer())
  const ct = fileRes.headers.get('content-type') || ''
  const name = json.link.toLowerCase()

  if (ct.includes('zip') || name.endsWith('.zip')) {
    return extractTextFromZip(buf)
  }

  const text = buf.toString('utf8')
  if (text.trim().startsWith('WEBVTT') || text.includes('-->')) return text
  return null
}

type SubtitleSearchItem = {
  attributes?: {
    files?: { file_id?: number }[]
    download_count?: number
  }
}

async function searchSpanishFileId(title: string, episode: number): Promise<number | null> {
  const headers = opensubtitlesHeaders()
  if (!headers) return null

  const params = new URLSearchParams({
    query: title,
    season_number: '1',
    episode_number: String(episode),
    languages: 'es,spa',
  })

  const res = await fetch(`${OPENSUBTITLES_API}/subtitles?${params}`, { headers })
  if (!res.ok) return null

  const json = (await res.json()) as { data?: SubtitleSearchItem[] }
  const items = json.data || []
  if (!items.length) return null

  const sorted = [...items].sort(
    (a, b) => (b.attributes?.download_count ?? 0) - (a.attributes?.download_count ?? 0),
  )

  for (const item of sorted) {
    for (const f of item.attributes?.files || []) {
      if (f.file_id) return f.file_id
    }
  }

  return null
}

async function resolveAnimeTitle(malId: number, episode: number): Promise<string | null> {
  const meta = await fetchJikan(`/anime/${malId}`, 86400)
  const base = meta?.data?.title_english || meta?.data?.title || null
  if (base) return base

  const eps = await fetchJikan(`/anime/${malId}/episodes?page=1`, 3600)
  const row = (eps?.data as { mal_id?: number; title?: string }[] | undefined)?.find(
    (e) => e.mal_id === episode,
  )
  return row?.title || base
}

export type SubtitleResolveResult = {
  vtt: string | null
  source: 'cache' | 'opensubtitles' | 'unconfigured' | 'not_found'
}

export async function resolveSpanishSubtitleVtt(
  malId: number,
  episode: number,
): Promise<SubtitleResolveResult> {
  const key = cacheKey(malId, episode)
  const hit = memCache.get(key)
  if (hit && hit.expires > Date.now()) {
    return { vtt: hit.vtt, source: 'cache' }
  }

  if (!opensubtitlesConfigured()) {
    return { vtt: null, source: 'unconfigured' }
  }

  const title = await resolveAnimeTitle(malId, episode)
  if (!title) return { vtt: null, source: 'not_found' }

  const fileId = await searchSpanishFileId(title, episode)
  if (!fileId) return { vtt: null, source: 'not_found' }

  const raw = await downloadSubtitleFile(fileId)
  if (!raw) return { vtt: null, source: 'not_found' }

  const vtt = srtToVtt(raw)
  if (!vtt.includes('-->')) return { vtt: null, source: 'not_found' }

  memCache.set(key, { vtt, expires: Date.now() + CACHE_TTL_MS })
  return { vtt, source: 'opensubtitles' }
}

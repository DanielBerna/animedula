import type { WatchImportPayload, WatchImportShow } from './import'

export type CsvImportRow = {
  mal_id: string
  title?: string
  episode: string
  lang: string
  source_type: string
  server_label: string
  url: string
  referer?: string
  sort_order?: string
  anilist_id?: string
}

export type CsvParseResult = {
  rows: CsvImportRow[]
  errors: string[]
  skipped: number
}

export type CsvPreview = {
  shows: number
  episodes: number
  sources: number
  malIds: number[]
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (c === ',' && !inQuotes) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += c
  }
  out.push(cur)
  return out
}

export function parseWatchFeedCsv(text: string): CsvParseResult {
  const errors: string[] = []
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'))
  if (lines.length < 2) {
    return { rows: [], errors: ['CSV vacío o sin filas de datos'], skipped: 0 }
  }

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const required = ['mal_id', 'episode', 'lang', 'source_type', 'server_label', 'url'] as const
  for (const col of required) {
    if (!header.includes(col)) errors.push(`Falta columna obligatoria: ${col}`)
  }
  if (errors.length) return { rows: [], errors, skipped: 0 }

  const rows: CsvImportRow[] = []
  let skipped = 0

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    const row: Record<string, string> = {}
    header.forEach((h, j) => {
      row[h] = (cells[j] ?? '').trim()
    })

    if (!row.mal_id || !row.url) {
      skipped += 1
      continue
    }

    rows.push(row as CsvImportRow)
  }

  return { rows, errors, skipped }
}

export function csvRowsToImportPayload(rows: CsvImportRow[]): WatchImportPayload {
  const shows = new Map<string, WatchImportShow>()

  for (const row of rows) {
    const malId = Number(row.mal_id)
    if (!Number.isFinite(malId)) continue

    const key = String(malId)
    if (!shows.has(key)) {
      shows.set(key, {
        mal_id: malId,
        title: row.title || `Anime ${malId}`,
        ...(row.anilist_id ? { anilist_id: Number(row.anilist_id) } : {}),
        episodes: [],
      })
    }

    const show = shows.get(key)!
    const epNum = Math.max(1, Number(row.episode) || 1)
    let ep = show.episodes.find((e) => e.episode === epNum)
    if (!ep) {
      ep = { episode: epNum, sources: [] }
      show.episodes.push(ep)
    }

    ep.sources.push({
      lang: (row.lang || 'sub') as 'lat' | 'sub' | 'dub',
      source_type: (row.source_type || 'iframe') as 'hls' | 'mp4' | 'iframe',
      server_label: row.server_label || 'Servidor',
      url: row.url,
      ...(row.referer ? { referer: row.referer } : {}),
      ...(row.sort_order ? { sort_order: Number(row.sort_order) || 0 } : {}),
    })
  }

  for (const show of shows.values()) {
    show.episodes.sort((a, b) => a.episode - b.episode)
  }

  return { shows: [...shows.values()] }
}

export function previewCsvImport(rows: CsvImportRow[]): CsvPreview {
  const payload = csvRowsToImportPayload(rows)
  const malIds = payload.shows.map((s) => s.mal_id!).filter(Boolean)
  let episodes = 0
  let sources = 0
  for (const show of payload.shows) {
    episodes += show.episodes.length
    for (const ep of show.episodes) {
      sources += ep.sources.length
    }
  }
  return { shows: payload.shows.length, episodes, sources, malIds }
}

export const WATCH_CSV_TEMPLATE = `mal_id,title,episode,lang,source_type,server_label,url,referer,sort_order
1535,Death Note,1,sub,iframe,Mega,https://ejemplo.com/embed/death-note/1,,
1535,Death Note,1,sub,iframe,RapidVideo,https://ejemplo.com/embed/death-note/1-alt,,1`

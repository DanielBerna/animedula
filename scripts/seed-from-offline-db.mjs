#!/usr/bin/env node
/**
 * Importa catálogo desde anime-offline-database (metadatos, sin URLs de video).
 *
 * Descarga el dataset:
 *   https://github.com/manami-project/anime-offline-database/releases/latest
 *   → anime-offline-database.jsonl o anime-offline-database-minified.json
 *   (descomprime .zst si aplica)
 *
 * Uso:
 *   node scripts/seed-from-offline-db.mjs ruta/al/archivo.jsonl --export catalog.json
 *   node scripts/seed-from-offline-db.mjs ruta/al/archivo.jsonl --push
 *   node scripts/seed-from-offline-db.mjs archivo.jsonl --push --limit 500 --status ONGOING --type TV
 *
 * --push requiere .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY
 */

import { createReadStream, readFileSync, writeFileSync, existsSync } from 'fs'
import { createInterface } from 'readline'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

const args = process.argv.slice(2)

function flag(name) {
  return args.includes(name)
}

function flagValue(name, fallback = null) {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : fallback
}

const inputPath = args.find((a) => !a.startsWith('-'))
const exportPath = flagValue('--export', null)
const doPush = flag('--push')
const dryRun = flag('--dry-run')
const limit = Number(flagValue('--limit', '0')) || 0
const priority = Number(flagValue('--priority', '10')) || 10
const minEpisodes = flagValue('--min-episodes', null)
const minScore = flagValue('--min-score', null)
const types = flagValue('--type', null)?.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
const statuses = flagValue('--status', null)?.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)

if (!inputPath) {
  console.error(`Uso: node scripts/seed-from-offline-db.mjs <archivo.jsonl|json> [--export out.json] [--push] [filtros]

Filtros:
  --limit N           Máximo de entradas (tras ordenar por score)
  --type TV,MOVIE     Tipos (coma)
  --status ONGOING    Estados (coma)
  --min-episodes N
  --min-score N
  --priority N        Prioridad en watch_media (default 10)
  --dry-run           Solo muestra conteos, no escribe
`)
  process.exit(1)
}

if (!exportPath && !doPush) {
  console.error('Indica --export catalog.json y/o --push')
  process.exit(1)
}

const ID_PATTERNS = [
  ['mal_id', /myanimelist\.net\/anime\/(\d+)/i],
  ['anilist_id', /anilist\.co\/anime\/(\d+)/i],
  ['kitsu_id', /kitsu\.(?:app|io)\/anime\/(\d+)/i],
]

function parseIdsFromSources(sources) {
  const out = { mal_id: null, anilist_id: null, kitsu_id: null }
  if (!sources?.length) return out
  for (const url of sources) {
    for (const [key, re] of ID_PATTERNS) {
      if (out[key] != null) continue
      const m = url.match(re)
      if (m) out[key] = Number(m[1])
    }
  }
  return out
}

function mapEntry(anime) {
  const title = anime.title?.trim()
  if (!title) return null
  const ids = parseIdsFromSources(anime.sources)
  if (!ids.mal_id && !ids.anilist_id) return null
  return {
    mal_id: ids.mal_id,
    anilist_id: ids.anilist_id,
    kitsu_id: ids.kitsu_id,
    title,
    episodes_total:
      typeof anime.episodes === 'number' && anime.episodes > 0 ? anime.episodes : null,
    anime_type: anime.type?.toUpperCase() || null,
    anime_status: anime.status?.toUpperCase() || null,
    score:
      typeof anime.score?.arithmeticGeometricMean === 'number'
        ? anime.score.arithmeticGeometricMean
        : null,
  }
}

function filterCandidates(list) {
  let filtered = list.filter((c) => {
    if (!c.mal_id) return false
    if (types?.length && c.anime_type && !types.includes(c.anime_type)) return false
    if (statuses?.length && c.anime_status && !statuses.includes(c.anime_status)) return false
    if (minEpisodes != null) {
      const min = Number(minEpisodes)
      if (!c.episodes_total || c.episodes_total < min) return false
    }
    if (minScore != null) {
      const min = Number(minScore)
      if (c.score == null || c.score < min) return false
    }
    return true
  })
  filtered.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  if (limit > 0) filtered = filtered.slice(0, limit)
  return filtered
}

async function loadJsonl(file) {
  const seen = new Set()
  const out = []
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity })

  for await (const line of rl) {
    const trimmed = line.trim()
    if (!trimmed) continue
    let obj
    try {
      obj = JSON.parse(trimmed)
    } catch {
      continue
    }
    if (obj.$schema || obj.license || obj.repository) continue
    const c = mapEntry(obj)
    if (!c?.mal_id || seen.has(c.mal_id)) continue
    seen.add(c.mal_id)
    out.push(c)
  }
  return out
}

function loadJson(file) {
  const raw = JSON.parse(readFileSync(file, 'utf8'))
  const items = Array.isArray(raw) ? raw : raw.data || []
  const seen = new Set()
  const out = []
  for (const item of items) {
    const c = mapEntry(item)
    if (!c?.mal_id || seen.has(c.mal_id)) continue
    seen.add(c.mal_id)
    out.push(c)
  }
  return out
}

function loadEnvFile() {
  for (const name of ['.env.local', '.env']) {
    const p = resolve(name)
    if (!existsSync(p)) continue
    const text = readFileSync(p, 'utf8')
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (!m || process.env[m[1]]) continue
      let val = m[2].trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      process.env[m[1]] = val
    }
  }
}

function getSupabase() {
  loadEnvFile()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY en .env.local')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

async function upsertCatalog(supabase, candidates) {
  let synced = 0
  let skipped = 0
  const errors = []

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]
    const label = `MAL ${c.mal_id}`

    const { data: existing } = await supabase
      .from('watch_media')
      .select('id')
      .eq('mal_id', c.mal_id)
      .maybeSingle()

    const base = {
      mal_id: c.mal_id,
      anilist_id: c.anilist_id,
      title: c.title,
      updated_at: new Date().toISOString(),
    }

    let mediaId
    if (existing?.id) {
      const { data, error } = await supabase
        .from('watch_media')
        .update(base)
        .eq('id', existing.id)
        .select('id')
        .maybeSingle()
      if (error) {
        errors.push(`${label}: ${error.message}`)
        continue
      }
      mediaId = data?.id
    } else {
      const { data, error } = await supabase
        .from('watch_media')
        .insert(base)
        .select('id')
        .maybeSingle()
      if (error) {
        errors.push(`${label}: ${error.message}`)
        continue
      }
      mediaId = data?.id
    }

    if (!mediaId) {
      skipped += 1
      continue
    }

    const { error: metaErr } = await supabase
      .from('watch_media')
      .update({
        catalog_source: 'import',
        priority,
        episodes_total: c.episodes_total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', mediaId)

    if (metaErr) {
      errors.push(`${label}: ${metaErr.message}`)
      continue
    }

    synced += 1
    if (i > 0 && i % 50 === 0) await new Promise((r) => setTimeout(r, 200))
  }

  await supabase.from('watch_ingest_runs').insert({
    job: 'seed-offline-db',
    shows_registered: synced,
    sources_added: 0,
    sources_skipped: skipped,
    errors: errors.slice(0, 20),
  })

  return { synced, skipped, errors }
}

const abs = resolve(inputPath)
const isJsonl = abs.toLowerCase().endsWith('.jsonl')
console.log(`Leyendo ${abs} (${isJsonl ? 'JSONL' : 'JSON'})…`)

const all = isJsonl ? await loadJsonl(abs) : loadJson(abs)
console.log(`Parseados: ${all.length} anime con MAL id`)

const candidates = filterCandidates(all)
console.log(`Tras filtros: ${candidates.length}`)

if (dryRun) {
  console.log('Dry-run — primeras 5 entradas:')
  console.log(JSON.stringify(candidates.slice(0, 5), null, 2))
  process.exit(0)
}

if (exportPath) {
  const payload = {
    catalog_source: 'import',
    priority,
    entries: candidates.map(({ mal_id, anilist_id, kitsu_id, title, episodes_total }) => ({
      mal_id,
      anilist_id,
      kitsu_id,
      title,
      episodes_total,
    })),
  }
  writeFileSync(resolve(exportPath), JSON.stringify(payload, null, 2), 'utf8')
  console.log(`Exportado → ${exportPath} (${candidates.length} entradas)`)
}

if (doPush) {
  const supabase = getSupabase()
  const { synced, skipped, errors } = await upsertCatalog(supabase, candidates)
  console.log(`Push OK: ${synced} registrados, ${skipped} omitidos`)
  if (errors.length) {
    console.warn(`Errores (${errors.length}):`)
    errors.slice(0, 10).forEach((e) => console.warn('  ', e))
  }
}

console.log('\nNota: esto solo llena watch_media (catálogo). Espejos latino siguen en watch-feed.csv → csv-to-watch-feed.mjs')

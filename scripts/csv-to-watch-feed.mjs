#!/usr/bin/env node
/**
 * Convierte CSV → watch-feed.json (formato importación Animédula).
 *
 * Uso:
 *   node scripts/csv-to-watch-feed.mjs scripts/mi-lista.csv
 *   node scripts/csv-to-watch-feed.mjs scripts/mi-lista.csv -o watch-feed.json
 *
 * Columnas CSV (cabecera obligatoria):
 *   mal_id, title, episode, lang, source_type, server_label, url
 * Opcionales: referer, sort_order, anilist_id
 *
 * NO descarga URLs de internet — solo organiza lo que tú pegas en el CSV.
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const args = process.argv.slice(2)
const input = args.find((a) => !a.startsWith('-'))
const outIdx = args.indexOf('-o')
const output = outIdx >= 0 ? args[outIdx + 1] : 'watch-feed.json'

if (!input) {
  console.error(`Uso: node scripts/csv-to-watch-feed.mjs <archivo.csv> [-o salida.json]`)
  process.exit(1)
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'))
  if (lines.length < 2) throw new Error('CSV vacío o sin filas de datos')

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const required = ['mal_id', 'episode', 'lang', 'source_type', 'server_label', 'url']
  for (const col of required) {
    if (!header.includes(col)) throw new Error(`Falta columna: ${col}`)
  }

  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    const row = {}
    header.forEach((h, j) => {
      row[h] = (cells[j] ?? '').trim()
    })
    if (!row.mal_id || !row.url) continue
    rows.push(row)
  }
  return rows
}

function splitCsvLine(line) {
  const out = []
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

function buildFeed(rows) {
  const shows = new Map()

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

    const show = shows.get(key)
    const epNum = Math.max(1, Number(row.episode) || 1)
    let ep = show.episodes.find((e) => e.episode === epNum)
    if (!ep) {
      ep = { episode: epNum, sources: [] }
      show.episodes.push(ep)
    }

    ep.sources.push({
      lang: row.lang || 'lat',
      source_type: row.source_type || 'iframe',
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

const raw = readFileSync(resolve(input), 'utf8')
const rows = parseCsv(raw)
const feed = buildFeed(rows)
const json = JSON.stringify(feed, null, 2)

writeFileSync(resolve(output), json, 'utf8')
const totalSources = feed.shows.reduce((n, s) => n + s.episodes.reduce((m, e) => m + e.sources.length, 0), 0)
console.log(`OK: ${feed.shows.length} anime, ${totalSources} espejos → ${output}`)
console.log('Siguiente paso:')
console.log('  1) Admin → /admin/espejos → pegar JSON en Importación masiva')
console.log('  2) O subir a URL pública y configurar WATCH_MIRROR_FEED_URL + cron sync-watch-mirrors')

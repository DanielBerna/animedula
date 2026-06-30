import { cache } from 'react'

const SPANISH_MARKERS = /\b(el|la|los|las|de|del|que|con|para|por|una|uno|es|en|más|juego|anime|noticia)\b|¿|¡|ñ|á|é|í|ó|ú/i

export function looksSpanish(text: string): boolean {
  if (!text?.trim()) return true
  const sample = text.slice(0, 400)
  const hits = (sample.match(SPANISH_MARKERS) || []).length
  const words = sample.split(/\s+/).filter(Boolean).length
  return hits >= 2 || (words > 0 && hits / words > 0.08)
}

async function myMemoryTranslate(text: string): Promise<string | null> {
  const chunk = text.trim().slice(0, 480)
  if (!chunk) return null

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|es-MX`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Animedula/1.0' },
      next: { revalidate: 86400 * 7 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const translated = data?.responseData?.translatedText as string | undefined
    if (!translated || translated.toUpperCase() === chunk.toUpperCase()) return null
    if (translated.includes('QUERY LENGTH LIMIT')) return null
    return translated
  } catch {
    return null
  }
}

export const translateToSpanish = cache(async (text: string): Promise<string> => {
  const trimmed = text?.trim()
  if (!trimmed) return ''
  if (looksSpanish(trimmed)) return trimmed

  const translated = await myMemoryTranslate(trimmed)
  return translated || trimmed
})

/** Parte un texto en trozos de <= maxLen respetando límites de oración/palabra. */
function chunkText(text: string, maxLen = 460): string[] {
  const clean = text.trim()
  if (clean.length <= maxLen) return [clean]

  const chunks: string[] = []
  // Dividir por oraciones; si una oración es muy larga, se parte por palabras.
  const sentences = clean.split(/(?<=[.!?。])\s+/)
  let current = ''
  for (const sentence of sentences) {
    if (sentence.length > maxLen) {
      if (current) {
        chunks.push(current)
        current = ''
      }
      const words = sentence.split(/\s+/)
      let part = ''
      for (const w of words) {
        if ((part + ' ' + w).trim().length > maxLen) {
          if (part) chunks.push(part)
          part = w
        } else {
          part = (part + ' ' + w).trim()
        }
      }
      if (part) current = part
      continue
    }
    if ((current + ' ' + sentence).trim().length > maxLen) {
      if (current) chunks.push(current)
      current = sentence
    } else {
      current = (current + ' ' + sentence).trim()
    }
  }
  if (current) chunks.push(current)
  return chunks
}

/**
 * Traduce textos largos (p. ej. sinopsis) al español por trozos, evitando el
 * límite de ~480 caracteres de MyMemory. Cada trozo se cachea por Next 7 días.
 * Si algún trozo falla, conserva el original de ese trozo (no rompe el texto).
 */
export const translateLongToSpanish = cache(async (text: string): Promise<string> => {
  const trimmed = text?.trim()
  if (!trimmed) return ''
  if (looksSpanish(trimmed)) return trimmed

  const chunks = chunkText(trimmed)
  const translated = await Promise.all(
    chunks.map(async (c) => (await myMemoryTranslate(c)) || c),
  )
  const joined = translated.join(' ').trim()
  return joined || trimmed
})

export async function translateFields<T extends Record<string, string | undefined>>(
  fields: T,
): Promise<T> {
  const entries = await Promise.all(
    Object.entries(fields).map(async ([key, value]) => {
      if (!value) return [key, value] as const
      return [key, await translateToSpanish(value)] as const
    }),
  )
  return Object.fromEntries(entries) as T
}

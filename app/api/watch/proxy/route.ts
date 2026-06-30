import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// Proxy de streaming: reenvía m3u8 y segmentos respetando el Referer del CDN
// (los hosts de anime bloquean hotlinking). No se guarda nada; solo se reenvía
// el flujo. Se reescriben los playlist para que los segmentos también pasen por
// aquí y así el navegador no necesite enviar headers que no puede.

function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase()
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h.endsWith('.local') ||
    h.startsWith('192.168.') ||
    h.startsWith('10.') ||
    h.startsWith('169.254.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h)
  )
}

function proxify(absUrl: string, ref: string, origin: string): string {
  const r = ref ? `&ref=${encodeURIComponent(ref)}` : ''
  return `${origin}/api/watch/proxy?url=${encodeURIComponent(absUrl)}${r}`
}

function rewritePlaylist(text: string, baseUrl: URL, ref: string, origin: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return line
      if (trimmed.startsWith('#')) {
        return line.replace(/URI="([^"]+)"/g, (_m, uri) => {
          try {
            const abs = new URL(uri, baseUrl).toString()
            return `URI="${proxify(abs, ref, origin)}"`
          } catch {
            return _m
          }
        })
      }
      try {
        const abs = new URL(trimmed, baseUrl).toString()
        return proxify(abs, ref, origin)
      } catch {
        return line
      }
    })
    .join('\n')
}

export async function GET(req: NextRequest) {
  const u = new URL(req.url)
  const target = u.searchParams.get('url')
  const ref = u.searchParams.get('ref') || ''
  if (!target) return new Response('Missing url', { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(target)
  } catch {
    return new Response('Bad url', { status: 400 })
  }
  if (!/^https?:$/.test(parsed.protocol) || isBlockedHost(parsed.hostname)) {
    return new Response('Forbidden', { status: 403 })
  }

  const headers: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    Accept: '*/*',
  }
  if (ref) {
    headers['Referer'] = ref
    try {
      headers['Origin'] = new URL(ref).origin
    } catch {
      /* ignore */
    }
  }

  let upstream: Response
  try {
    upstream = await fetch(target, { headers, redirect: 'follow' })
  } catch {
    return new Response('Upstream fetch failed', { status: 502 })
  }
  if (!upstream.ok || !upstream.body) {
    return new Response('Upstream error', { status: 502 })
  }

  const ct = upstream.headers.get('content-type') || ''
  const isPlaylist = ct.includes('mpegurl') || /\.m3u8(\?|$)/.test(target)

  if (isPlaylist) {
    const text = await upstream.text()
    const rewritten = rewritePlaylist(text, parsed, ref, u.origin)
    return new Response(rewritten, {
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    })
  }

  const respHeaders = new Headers()
  respHeaders.set('Content-Type', ct || 'application/octet-stream')
  respHeaders.set('Access-Control-Allow-Origin', '*')
  respHeaders.set('Cache-Control', 'no-store')
  return new Response(upstream.body, { headers: respHeaders })
}

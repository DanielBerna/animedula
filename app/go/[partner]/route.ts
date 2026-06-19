import { NextRequest } from 'next/server'
import { resolveGoUrl, StreamingPartner } from '../../../lib/affiliates'

const VALID = ['mercadolibre', 'crunchyroll', 'netflix', 'prime'] as const

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ partner: string }> }
) {
  const { partner: raw } = await params

  if (!VALID.includes(raw as typeof VALID[number])) {
    return new Response('Destino no válido', { status: 400 })
  }

  const url = new URL(req.url)
  const query = url.searchParams.get('q') || undefined
  const anime = url.searchParams.get('anime') || undefined
  const dest = url.searchParams.get('dest') || undefined

  const target = resolveGoUrl(raw as StreamingPartner | 'mercadolibre', { query, anime, dest })

  console.info('[external-link]', {
    partner: raw,
    query,
    anime,
    at: new Date().toISOString(),
  })

  return Response.redirect(target, 302)
}

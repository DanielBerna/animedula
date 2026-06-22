import { NextRequest } from 'next/server'
import { resolveGoUrl, StreamingPartner } from '../../../lib/affiliates'
import { isSafeHttpsUrl } from '../../../lib/security/urls'

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

  if (!isSafeHttpsUrl(target)) {
    return new Response('URL de destino no válida', { status: 400 })
  }

  return Response.redirect(target, 302)
}

import { NextRequest } from 'next/server'
import { AffiliatePartner, resolveAffiliateUrl } from '../../../lib/affiliates'

const VALID: AffiliatePartner[] = ['amazon', 'mercadolibre', 'crunchyroll', 'prime']

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ partner: string }> }
) {
  const { partner: raw } = await params
  const partner = raw as AffiliatePartner

  if (!VALID.includes(partner)) {
    return new Response('Partner no válido', { status: 400 })
  }

  const url = new URL(req.url)
  const query = url.searchParams.get('q') || undefined
  const dest = url.searchParams.get('dest') || undefined
  const anime = url.searchParams.get('anime') || undefined
  const mal = url.searchParams.get('mal') || undefined

  const target = resolveAffiliateUrl(partner, { query, dest, anime })

  console.info('[affiliate-click]', {
    partner,
    country: 'mx',
    anime,
    mal,
    query,
    ip: req.headers.get('x-forwarded-for') || 'anon',
    at: new Date().toISOString(),
  })

  return Response.redirect(target, 302)
}

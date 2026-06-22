import type { NextRequest } from 'next/server'
import { checkRateLimit, type RateTier } from '../ratelimit'

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'anon'
}

export async function requireRateLimit(
  req: NextRequest,
  tier: RateTier,
  scope: string,
): Promise<Response | null> {
  const ip = getClientIp(req)
  const key = `${tier}:${scope}:${ip}`
  const limit = await checkRateLimit(key, tier)
  if (!limit.success) {
    return Response.json({ error: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 })
  }
  return null
}

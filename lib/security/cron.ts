import type { NextRequest } from 'next/server'

export function authorizeCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return process.env.NODE_ENV === 'development'
  const auth = req.headers.get('authorization') || ''
  return auth === `Bearer ${secret}`
}

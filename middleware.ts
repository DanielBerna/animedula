import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './lib/supabase/middleware'
import { cspForPath } from './lib/security/csp'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin')) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      return NextResponse.redirect(new URL('/login?error=supabase', request.url))
    }
  }

  const response = await updateSession(request)
  // Una sola CSP por ruta (evita que next.config duplique políticas en /ver).
  response.headers.set('Content-Security-Policy', cspForPath(pathname))
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

import type { NextConfig } from 'next'

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com https://googleads.g.doubleclick.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.jikan.moe https://pagead2.googlesyndication.com https://www.google-analytics.com https://googleads.g.doubleclick.net",
  "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ')

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: csp },
]

// CSP específica de la sección /ver (aislada): permite reproductores externos
// en iframe y media HLS (blob). El resto del sitio mantiene la CSP estricta.
const watchCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "media-src 'self' blob: data: https:",
  "frame-src https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ')

const watchHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // MegaPlay/NinjaStream exigen Referer del sitio que embebe; no-referrer rompe el iframe.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: watchCsp },
]

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.myanimelist.net', pathname: '/images/**' },
      { protocol: 'https', hostname: 'www.freetogame.com', pathname: '/g/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
  },
  async headers() {
    return [
      // Sección de visionado: CSP relajada (iframes/HLS externos) y aislada.
      { source: '/ver', headers: watchHeaders },
      { source: '/ver/:path*', headers: watchHeaders },
      { source: '/admin', headers: securityHeaders },
      { source: '/admin/:path*', headers: securityHeaders },
      { source: '/((?!ver$|ver/|admin$|admin/).*)', headers: securityHeaders },
    ]
  },
}

export default nextConfig

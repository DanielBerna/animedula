import type { NextConfig } from 'next'

// CSP se aplica en middleware.ts (una política por ruta). Aquí solo cabeceras complementarias.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const watchHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // MegaPlay/NinjaStream exigen Referer del sitio que embebe; no-referrer rompe el iframe.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
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
      { source: '/ver', headers: watchHeaders },
      { source: '/ver/:path*', headers: watchHeaders },
      { source: '/:path*', headers: securityHeaders },
    ]
  },
}

export default nextConfig

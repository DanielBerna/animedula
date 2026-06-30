import type { NextConfig } from 'next'
import { siteCsp, watchCsp } from './lib/security/csp'

// CSP por ruta en headers() — una sola política por página (evita mezclar AdSense con /ver).
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: siteCsp },
]

const watchHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
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
      { source: '/ver', headers: watchHeaders },
      { source: '/ver/:path*', headers: watchHeaders },
      // Sin /ver — si también aplicara siteCsp, el navegador intersecta frame-src y bloquea MegaPlay/Vidlink.
      { source: '/((?!ver$)(?!ver/).*)', headers: securityHeaders },
    ]
  },
}

export default nextConfig

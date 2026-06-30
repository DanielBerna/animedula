'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const enabled = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true' && Boolean(client)

export default function AdScript() {
  const pathname = usePathname()
  if (!enabled || !client) return null
  // La sección de visionado (/ver) queda aislada de AdSense a propósito.
  if (pathname?.startsWith('/ver')) return null

  return (
    <Script
      id="adsense-loader"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  )
}

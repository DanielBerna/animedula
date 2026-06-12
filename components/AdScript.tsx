import Script from 'next/script'

const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const enabled = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true' && Boolean(client)

export default function AdScript() {
  if (!enabled || !client) return null

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

'use client'

import { useEffect, useRef } from 'react'
import { UI } from '../lib/copy'

type Props = {
  slot: string
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical'
  className?: string
  label?: string
}

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[]
  }
}

function isValidSlot(slot: string) {
  return /^\d{8,12}$/.test(slot.trim())
}

export default function AdSlot({ slot, format = 'auto', className = '', label = UI.adLabel }: Props) {
  const enabled = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true'
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
  const ready = enabled && client && isValidSlot(slot)
  const pushed = useRef(false)

  useEffect(() => {
    if (!ready || pushed.current) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      pushed.current = true
    } catch {
      // script aún cargando
    }
  }, [ready])

  if (!enabled || !client) {
    return (
      <div className={`ad-placeholder px-6 py-10 text-center ${className}`} aria-hidden>
        <span className="eyebrow text-faint">{label}</span>
        <p className="mt-2 text-sm text-faint">{UI.adPending}</p>
      </div>
    )
  }

  if (!isValidSlot(slot)) {
    return (
      <div className={`ad-placeholder px-6 py-8 text-center ${className}`} aria-hidden>
        <span className="eyebrow text-faint">{label}</span>
        <p className="mt-2 text-xs text-faint">Pega el data-ad-slot en .env.local</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <p className="eyebrow text-faint mb-2">{label}</p>
      <ins
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}

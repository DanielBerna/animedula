'use client'

import Image from 'next/image'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { HeroSlide, HeroVariant } from '../lib/heroImages'

type Props = {
  variant?: HeroVariant
  images: HeroSlide[]
  className?: string
  large?: boolean
  children: ReactNode
}

const INTERVAL_MS = 6500

export default function HeroBanner({
  variant = 'default',
  images,
  className = '',
  large = false,
  children,
}: Props) {
  const slides = useMemo(() => images.filter((s) => s.url), [images])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length)
    }, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [slides.length])

  useEffect(() => {
    const next = slides[(index + 1) % slides.length]?.url
    if (!next) return
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = next
    document.head.appendChild(link)
    return () => {
      link.remove()
    }
  }, [index, slides])

  return (
    <div
      className={`hero-banner hero-banner-${variant} ${large ? 'hero-banner-lg' : ''} enter-up ${className}`.trim()}
    >
      <div className="hero-banner-slides" aria-hidden>
        {slides.map((slide, i) => (
          <div
            key={`${slide.url}-${i}`}
            className={[
              'hero-banner-slide',
              slide.soft ? 'hero-banner-slide-poster' : '',
              i === index ? 'is-active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <Image
              src={slide.url}
              alt=""
              fill
              sizes="100vw"
              quality={92}
              priority={i === 0}
              className="hero-banner-img"
              unoptimized={slide.soft}
            />
          </div>
        ))}
      </div>
      <div className="hero-banner-overlay" aria-hidden />
      <div className="hero-banner-content">{children}</div>
    </div>
  )
}

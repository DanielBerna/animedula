'use client'

import Link from 'next/link'
import HeroBanner from './HeroBanner'
import { pickHeroImages } from '../lib/heroImages'

type Props = {
  images?: (string | undefined | null)[]
}

export default function HomeHero({ images }: Props) {
  const slides = pickHeroImages('anime', images)

  return (
    <HeroBanner variant="anime" images={slides} large className="mb-10">
      <div className="relative w-full">
        <div className="max-w-2xl">
          <h1 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.05] tracking-tight hero-title">
            Tu próxima <span className="hero-title-accent">maratón</span> empieza aquí
          </h1>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/explorar" className="btn-primary">
              Explorar anime
            </Link>
            <Link href="/calendario" className="btn-ghost hero-btn-ghost">
              Ver calendario
            </Link>
          </div>
        </div>
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 text-[7rem] opacity-[0.12] select-none animate-float hidden lg:block pointer-events-none hero-title"
          aria-hidden
        >
          夢
        </div>
      </div>
    </HeroBanner>
  )
}

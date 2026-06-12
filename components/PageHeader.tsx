import { ReactNode } from 'react'
import HeroBanner from './HeroBanner'
import { HeroVariant, pickHeroImages } from '../lib/heroImages'

type Props = {
  eyebrow?: string
  title: string
  description?: string
  variant?: HeroVariant
  images?: (string | undefined | null)[]
  large?: boolean
  children?: ReactNode
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  variant = 'default',
  images,
  large,
  children,
}: Props) {
  const slides = pickHeroImages(variant, images)

  return (
    <HeroBanner variant={variant} images={slides} large={large}>
      <header className="space-y-3">
        {eyebrow && <p className="eyebrow hero-eyebrow">{eyebrow}</p>}
        <h1 className="page-title hero-title">{title}</h1>
        {description && <p className="page-desc hero-desc">{description}</p>}
        {children && <div className="pt-1">{children}</div>}
      </header>
    </HeroBanner>
  )
}

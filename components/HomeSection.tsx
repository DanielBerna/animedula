import Link from 'next/link'
import type { ReactNode } from 'react'

type Accent = 'default' | 'anime' | 'calendar' | 'manga' | 'news' | 'community'

type Props = {
  eyebrow?: string
  title: string
  subtitle?: string
  href?: string
  linkLabel?: string
  accent?: Accent
  className?: string
  bodyClassName?: string
  children: ReactNode
}

export default function HomeSection({
  eyebrow,
  title,
  subtitle,
  href,
  linkLabel = 'Ver todo →',
  accent = 'default',
  className = '',
  bodyClassName = '',
  children,
}: Props) {
  return (
    <section className={`home-column-block home-accent-${accent} enter-up ${className}`.trim()}>
      <header className="home-column-head">
        <div className="home-column-head-text">
          {eyebrow ? <p className="home-column-eyebrow">{eyebrow}</p> : null}
          <h2 className="home-column-title">{title}</h2>
          {subtitle ? <p className="home-column-subtitle">{subtitle}</p> : null}
        </div>
        {href ? (
          <Link href={href} className="home-column-link">
            {linkLabel}
          </Link>
        ) : null}
      </header>
      <div className={`home-column-body ${bodyClassName}`.trim()}>{children}</div>
    </section>
  )
}

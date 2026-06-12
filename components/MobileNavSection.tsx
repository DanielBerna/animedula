'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import SectionIcon from './icons/SectionIcon'
import type { NavItem } from '../lib/nav'
import { isNavActive } from '../lib/nav'

type Props = {
  label?: string
  items: NavItem[]
  path: string
  onNavigate: () => void
  collapsible?: boolean
}

export default function MobileNavSection({
  label,
  items,
  path,
  onNavigate,
  collapsible = false,
}: Props) {
  const hasActiveChild = items.some((item) => isNavActive(item.href, path, item.match))
  const [expanded, setExpanded] = useState(!collapsible || hasActiveChild)

  useEffect(() => {
    if (hasActiveChild) setExpanded(true)
  }, [hasActiveChild])

  if (!collapsible || !label) {
    return (
      <div className="offcanvas-nav-group">
        {label ? <p className="offcanvas-nav-label">{label}</p> : null}
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`side-nav-link${isNavActive(item.href, path, item.match) ? ' is-active' : ''}`}
            aria-current={isNavActive(item.href, path, item.match) ? 'page' : undefined}
          >
            <SectionIcon name={item.icon} size={20} className="side-nav-icon" />
            <span className="side-nav-label">{item.label}</span>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className={`offcanvas-nav-group${expanded ? ' is-expanded' : ''}`}>
      <button
        type="button"
        className="side-nav-group-trigger focus-ring"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="side-nav-group-title">{label}</span>
        <svg className="side-nav-group-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div className="side-nav-submenu" hidden={!expanded}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`side-nav-link side-nav-sublink${isNavActive(item.href, path, item.match) ? ' is-active' : ''}`}
            aria-current={isNavActive(item.href, path, item.match) ? 'page' : undefined}
          >
            <SectionIcon name={item.icon} size={18} className="side-nav-icon" />
            <span className="side-nav-label">
              <span>{item.label}</span>
              {item.description ? (
                <span className="side-nav-sublink-desc">{item.description}</span>
              ) : null}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

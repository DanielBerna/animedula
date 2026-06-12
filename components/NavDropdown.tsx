'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import SectionIcon from './icons/SectionIcon'
import type { NavGroup } from '../lib/nav'
import { isNavActive } from '../lib/nav'

type Props = {
  group: NavGroup
  path: string
  active: boolean
}

export default function NavDropdown({ group, path, active }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    setOpen(false)
  }, [path])

  useEffect(() => {
    if (!open) return

    const onOutside = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    // Evita que el mismo clic de apertura cierre el panel al instante
    const timer = window.setTimeout(() => {
      document.addEventListener('click', onOutside)
    }, 0)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('click', onOutside)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className={`nav-dropdown${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className={`nav-pill nav-dropdown-trigger${active ? ' is-active' : ''}${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={panelId}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        <SectionIcon name={group.icon} size={15} className="nav-pill-icon" />
        <span className="nav-pill-text">{group.label}</span>
        <svg className="nav-dropdown-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div id={panelId} className="nav-dropdown-panel" role="menu">
          {group.items.map((item) => {
            const itemActive = isNavActive(item.href, path, item.match)
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className={`nav-dropdown-link${itemActive ? ' is-active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <SectionIcon name={item.icon} size={18} className="nav-dropdown-icon" />
                <span className="nav-dropdown-copy">
                  <span className="nav-dropdown-label">{item.label}</span>
                  {item.description ? (
                    <span className="nav-dropdown-desc">{item.description}</span>
                  ) : null}
                </span>
              </Link>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

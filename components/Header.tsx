"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { SITE } from '../lib/copy'
import { MOBILE_NAV, NAV_MENU, isGroupActive, isNavActive } from '../lib/nav'
import Logo from './Logo'
import MobileNavSection from './MobileNavSection'
import NavDropdown from './NavDropdown'
import SectionIcon, { IconName } from './icons/SectionIcon'
import ThemeToggle from './ThemeToggle'
import UserMenu from './UserMenu'
import NotificationBell from './NotificationBell'

function MobileNav({ open, onClose, path }: { open: boolean; onClose: () => void; path: string }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!mounted) return null

  return createPortal(
    <>
      <div
        className={`offcanvas-backdrop ${open ? 'is-visible' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`offcanvas ${open ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        aria-hidden={!open}
      >
        <div className="offcanvas-header">
          <Link href="/" className="offcanvas-brand" onClick={onClose}>
            <Logo size={36} className="logo-mark-svg" />
            <span className="font-display font-bold text-text truncate">{SITE.name}</span>
          </Link>
          <button type="button" className="offcanvas-close focus-ring" onClick={onClose} aria-label="Cerrar menú">
            <SectionIcon name="close" size={22} />
          </button>
        </div>

        <nav className="offcanvas-nav" aria-label="Secciones">
          {MOBILE_NAV.map((block) => (
            <MobileNavSection
              key={block.label || 'inicio'}
              label={block.label}
              items={block.items}
              path={path}
              onNavigate={onClose}
              collapsible={Boolean(block.label && block.items.length > 1)}
            />
          ))}
        </nav>

        <div className="offcanvas-footer">
          <div className="offcanvas-actions">
            <NotificationBell variant="drawer" />
            <UserMenu variant="drawer" />
            <ThemeToggle showLabel />
          </div>
          <div className="offcanvas-legal">
            <Link href="/privacidad" className="offcanvas-legal-link" onClick={onClose}>Privacidad</Link>
            <span className="text-faint" aria-hidden>·</span>
            <Link href="/terminos" className="offcanvas-legal-link" onClick={onClose}>Términos</Link>
          </div>
        </div>
      </aside>
    </>,
    document.body
  )
}

function DesktopNavLink({
  href,
  label,
  icon,
  active,
}: {
  href: string
  label: string
  icon: IconName
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`nav-pill${active ? ' is-active' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      <SectionIcon name={icon} size={15} className="nav-pill-icon" />
      <span className="nav-pill-text">{label}</span>
    </Link>
  )
}

export default function Header() {
  const [open, setOpen] = useState(false)
  const path = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [path])

  return (
    <header className="header-blur">
      <div className="header-inner">
        <div className="header-slot-start">
          <button
            type="button"
            className="menu-trigger focus-ring"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={open}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>

        <Link href="/" className="header-logo group">
          <Logo size={40} className="logo-mark-svg" />
          <span className="header-logo-text">{SITE.name}</span>
        </Link>

        <nav className="header-nav" aria-label="Principal">
          <div className="header-nav-track">
            {NAV_MENU.map((entry) => {
              if (entry.type === 'link') {
                const { item } = entry
                return (
                  <DesktopNavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    active={isNavActive(item.href, path, item.match)}
                  />
                )
              }
              return (
                <NavDropdown
                  key={entry.group.id}
                  group={entry.group}
                  path={path}
                  active={isGroupActive(entry.group, path)}
                />
              )
            })}
          </div>
        </nav>

        <div className="header-actions">
          <NotificationBell variant="inline" />
          <div className="header-user-inline">
            <UserMenu variant="inline" />
          </div>
          <div className="header-theme-wrap">
            <ThemeToggle />
          </div>
        </div>
      </div>
      <MobileNav open={open} onClose={() => setOpen(false)} path={path} />
    </header>
  )
}

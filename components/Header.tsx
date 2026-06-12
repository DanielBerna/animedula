"use client"

import Link from 'next/link'
import { useState } from 'react'
import { NAV, SITE } from '../lib/copy'
import Logo from './Logo'
import SectionIcon, { IconName } from './icons/SectionIcon'
import ThemeToggle from './ThemeToggle'

const NAV_ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: NAV.home, icon: 'home' },
  { href: '/explorar', label: NAV.explore, icon: 'explore' },
  { href: '/calendario', label: NAV.calendar, icon: 'calendar' },
  { href: '/mangas', label: NAV.manga, icon: 'manga' },
  { href: '/coleccionables', label: NAV.collect, icon: 'collect' },
  { href: '/tecnologia', label: NAV.tech, icon: 'tech' },
]

function NavLink({ href, label, icon, onClick, mobile }: { href: string; label: string; icon: IconName; onClick?: () => void; mobile?: boolean }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`nav-link nav-link-icon whitespace-nowrap ${mobile ? 'py-3 px-3 rounded-lg hover:bg-white/5 w-full' : ''}`}
    >
      <SectionIcon name={icon} size={16} className="nav-link-svg" />
      {label}
    </Link>
  )
}

function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <div className="offcanvas-backdrop" onClick={onClose} />}
      <aside className={`offcanvas ${open ? 'open' : ''}`} role="dialog" aria-label="Menú" aria-hidden={!open}>
        <button className="absolute left-4 top-4 text-muted hover:text-text transition" onClick={onClose} aria-label="Cerrar menú">
          <SectionIcon name="close" size={20} />
        </button>
        <div className="mt-12 mb-6 flex items-center gap-3">
          <Logo size={36} className="logo-mark-svg" />
          <p className="font-display font-bold text-text">{SITE.name}</p>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} onClick={onClose} mobile />
          ))}
        </nav>
        <div className="mt-8 pt-6 border-t border-white/8">
          <ThemeToggle />
        </div>
      </aside>
    </>
  )
}

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="w-full header-blur">
      <div className="container mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <Logo size={44} className="logo-mark-svg" />
          <div className="hidden sm:block">
            <p className="font-display text-base font-bold tracking-tight text-text group-hover:text-white transition">{SITE.name}</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Principal">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <button
            className="lg:hidden p-2.5 rounded-lg bg-surface-3 border border-white/8 text-muted hover:text-text transition focus-ring"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>
      <MobileNav open={open} onClose={() => setOpen(false)} />
    </header>
  )
}

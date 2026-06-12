"use client"

import Link from 'next/link'
import { useState } from 'react'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'

const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/explorar', label: 'Explorar' },
  { href: '/calendario', label: 'Calendario' },
  { href: '/mangas', label: 'Mangas' },
  { href: '/coleccionables', label: 'Colección' },
  { href: '/tecnologia', label: 'Tech' },
]

function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <div className="offcanvas-backdrop" onClick={onClose} />}
      <div className={`offcanvas ${open ? 'open' : ''}`} role="dialog" aria-hidden={!open}>
        <button className="absolute left-4 top-4 text-muted hover:text-text transition" onClick={onClose} aria-label="Cerrar menú">✕</button>
        <div className="mt-12 mb-6">
          <p className="eyebrow">Navegación</p>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} onClick={onClose} className="nav-link py-3 px-3 rounded-lg hover:bg-white/5">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 pt-6 border-t border-white/8">
          <ThemeToggle />
        </div>
      </div>
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
            <p className="font-display text-base font-bold tracking-tight text-text group-hover:text-white transition">Animédula</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-5 xl:gap-6">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link whitespace-nowrap">
              {item.label}
            </Link>
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

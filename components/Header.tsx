"use client"



import Link from 'next/link'

import { usePathname } from 'next/navigation'

import { useEffect, useState } from 'react'

import { createPortal } from 'react-dom'

import { NAV, SITE } from '../lib/copy'

import Logo from './Logo'

import SectionIcon, { IconName } from './icons/SectionIcon'

import ThemeToggle from './ThemeToggle'

import UserMenu from './UserMenu'



type NavItem = {

  href: string

  label: string

  short?: string

  icon: IconName

  match?: (p: string) => boolean

}



type NavGroup = {

  label?: string

  items: NavItem[]

}



const NAV_GROUPS: NavGroup[] = [

  {

    items: [

      { href: '/', label: NAV.home, icon: 'home', match: (p) => p === '/' },

    ],

  },

  {

    label: 'Descubrir',

    items: [

      { href: '/explorar', label: NAV.explore, short: 'Explorar', icon: 'explore', match: (p) => p.startsWith('/explorar') },

      {

        href: '/calendario',

        label: NAV.seasons,

        short: 'Temporadas',

        icon: 'calendar',

        match: (p) => p.startsWith('/calendario') || p === '/anime',

      },

    ],

  },

  {

    label: 'Contenido',

    items: [

      { href: '/mangas', label: NAV.manga, icon: 'manga', match: (p) => p.startsWith('/mangas') },

      { href: '/coleccionables', label: NAV.collect, short: 'Colección', icon: 'collect', match: (p) => p.startsWith('/coleccionables') },

      { href: '/tecnologia', label: NAV.tech, short: 'Tech', icon: 'tech', match: (p) => p.startsWith('/tecnologia') },

    ],

  },

  {

    items: [

      { href: '/comunidad', label: NAV.community, short: 'Comunidad', icon: 'collect', match: (p) => p.startsWith('/comunidad') },

    ],

  },

]



const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items)



function isActive(href: string, path: string, match?: (p: string) => boolean) {

  if (match) return match(path)

  return path === href || path.startsWith(`${href}/`)

}



function NavLink({

  href,

  label,

  short,

  icon,

  active,

  onClick,

  drawer,

  compact,

}: {

  href: string

  label: string

  short?: string

  icon: IconName

  active?: boolean

  onClick?: () => void

  drawer?: boolean

  compact?: boolean

}) {

  if (drawer) {

    return (

      <Link

        href={href}

        onClick={onClick}

        className={`side-nav-link${active ? ' is-active' : ''}`}

        aria-current={active ? 'page' : undefined}

      >

        <SectionIcon name={icon} size={20} className="side-nav-icon" />

        <span className="side-nav-label">{label}</span>

      </Link>

    )

  }



  const display = compact && short ? short : label



  return (

    <Link

      href={href}

      onClick={onClick}

      className={`nav-pill${active ? ' is-active' : ''}`}

      aria-current={active ? 'page' : undefined}

      title={label}

    >

      <SectionIcon name={icon} size={15} className="nav-pill-icon" />

      <span className="nav-pill-text">{display}</span>

    </Link>

  )

}



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

      <div className={`offcanvas-backdrop ${open ? 'is-visible' : ''}`} onClick={onClose} aria-hidden={!open} />

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

          {NAV_GROUPS.map((group) => (

            <div key={group.label || 'main'} className="offcanvas-nav-group">

              {group.label ? <p className="offcanvas-nav-label">{group.label}</p> : null}

              {group.items.map((item) => (

                <NavLink

                  key={item.href}

                  {...item}

                  active={isActive(item.href, path, item.match)}

                  onClick={onClose}

                  drawer

                />

              ))}

            </div>

          ))}

        </nav>



        <div className="offcanvas-footer">

          <div className="offcanvas-actions">

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



export default function Header() {

  const [open, setOpen] = useState(false)

  const [compactNav, setCompactNav] = useState(false)

  const path = usePathname()



  useEffect(() => {

    setOpen(false)

  }, [path])



  useEffect(() => {

    const mq = window.matchMedia('(max-width: 1279px)')

    const update = () => setCompactNav(mq.matches)

    update()

    mq.addEventListener('change', update)

    return () => mq.removeEventListener('change', update)

  }, [])



  return (

    <header className="header-blur">

      <div className="header-inner">

        <Link href="/" className="header-logo group">

          <Logo size={40} className="logo-mark-svg" />

          <span className="header-logo-text">{SITE.name}</span>

        </Link>



        <nav className="header-nav" aria-label="Principal">

          <div className="header-nav-track">

            {NAV_ITEMS.map((item) => (

              <NavLink

                key={item.href}

                {...item}

                active={isActive(item.href, path, item.match)}

                compact={compactNav}

              />

            ))}

          </div>

        </nav>



        <div className="header-actions">

          <UserMenu variant="inline" />

          <div className="header-theme-wrap">

            <ThemeToggle />

          </div>

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

      </div>

      <MobileNav open={open} onClose={() => setOpen(false)} path={path} />

    </header>

  )

}



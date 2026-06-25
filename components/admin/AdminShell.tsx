'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { adminNavForRole } from '../../lib/admin/nav'

type Props = {
  role: string
  displayName: string
  children: ReactNode
}

export default function AdminShell({ role, displayName, children }: Props) {
  const path = usePathname()
  const groups = adminNavForRole(role)
  const isAdmin = role === 'admin'
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    setNavOpen(false)
  }, [path])

  const isItemActive = (href: string) =>
    href === '/admin' ? path === '/admin' : path === href || path.startsWith(`${href}/`)

  const currentLabel =
    groups.flatMap((g) => g.items).find((it) => isItemActive(it.href))?.label || 'Panel'

  return (
    <div className="admin-shell">
      <button
        type="button"
        className="admin-nav-toggle focus-ring"
        onClick={() => setNavOpen((o) => !o)}
        aria-expanded={navOpen}
        aria-controls="admin-sidebar"
      >
        <span className="admin-nav-toggle-icon" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </span>
        <span className="admin-nav-toggle-label">{currentLabel}</span>
        <span className="admin-nav-toggle-hint">{navOpen ? 'Cerrar' : 'Menú'}</span>
      </button>

      <aside id="admin-sidebar" className={`admin-sidebar card-glass${navOpen ? ' is-open' : ''}`}>
        <div className="admin-sidebar-head">
          <p className="admin-sidebar-eyebrow">Aniministrador</p>
          <h1 className="admin-sidebar-title">Panel</h1>
          <p className="text-xs text-muted truncate">{displayName}</p>
          <span className="tag tag-accent text-[10px] mt-2 inline-block">
            {isAdmin ? 'Administrador' : 'Editor'}
          </span>
        </div>
        <nav className="admin-sidebar-nav" aria-label="Aniministrador">
          {groups.map((group) => (
            <div key={group.id} className="admin-nav-group">
              <p className="admin-nav-group-label">{group.label}</p>
              <ul className="admin-nav-list">
                {group.items.map((item) => {
                  const active = isItemActive(item.href)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`admin-nav-link${active ? ' is-active' : ''}`}
                        aria-current={active ? 'page' : undefined}
                      >
                        {item.icon ? <span aria-hidden>{item.icon}</span> : null}
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <Link href="/" className="text-xs text-muted hover:text-accent">
            ← Volver al sitio
          </Link>
        </div>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  )
}

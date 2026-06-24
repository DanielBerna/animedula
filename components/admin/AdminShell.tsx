'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
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

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar card-glass">
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
                  const active =
                    item.href === '/admin'
                      ? path === '/admin'
                      : path === item.href || path.startsWith(`${item.href}/`)
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

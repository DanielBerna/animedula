export type AdminNavItem = {
  href: string
  label: string
  icon?: string
  adminOnly?: boolean
}

export type AdminNavGroup = {
  id: string
  label: string
  items: AdminNavItem[]
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    id: 'overview',
    label: 'General',
    items: [{ href: '/admin', label: 'Dashboard', icon: '📊' }],
  },
  {
    id: 'content',
    label: 'Contenido',
    items: [
      { href: '/admin/resenas', label: 'Reseñas', icon: '✍️' },
      { href: '/admin/calendario', label: 'Calendario', icon: '📅' },
      { href: '/admin/aportes', label: 'Aportes', icon: '📥' },
      { href: '/admin/espejos', label: 'Espejos /ver', icon: '📺' },
    ],
  },
  {
    id: 'rewards',
    label: 'Premios',
    items: [{ href: '/admin/premios', label: 'Stickers · Marcos · Insignias', icon: '🎁' }],
  },
  {
    id: 'community',
    label: 'Comunidad',
    items: [{ href: '/admin/usuarios', label: 'Usuarios', icon: '👥', adminOnly: true }],
  },
  {
    id: 'finance',
    label: 'Finanzas',
    items: [{ href: '/admin/finanzas', label: 'Ingresos y gastos', icon: '💰', adminOnly: true }],
  },
  {
    id: 'config',
    label: 'Configuración',
    items: [{ href: '/admin/categorias', label: 'Categorías', icon: '🏷️' }],
  },
]

export function adminNavForRole(role: string) {
  const isAdmin = role === 'admin'
  return ADMIN_NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.adminOnly || isAdmin),
  })).filter((g) => g.items.length > 0)
}

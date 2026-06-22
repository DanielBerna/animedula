import Link from 'next/link'

const LINKS = [
  { href: '/admin', label: 'Moderación reseñas' },
  { href: '/admin/calendario', label: 'Calendario editorial' },
  { href: '/admin/catalogo', label: 'Catálogo premios' },
  { href: '/perfil', label: 'Mi perfil' },
]

export default function AdminNav({ active }: { active?: string }) {
  return (
    <nav className="admin-nav flex flex-wrap gap-2" aria-label="Administración">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`admin-nav-link text-xs${active === link.href ? ' is-active' : ''}`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}

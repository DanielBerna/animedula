import Link from 'next/link'
import Logo from './Logo'

const LINKS = [
  { href: '/explorar', label: 'Explorar' },
  { href: '/calendario', label: 'Calendario' },
  { href: '/mangas', label: 'Mangas' },
  { href: '/coleccionables', label: 'Coleccionables' },
  { href: '/tecnologia', label: 'Tecnología' },
  { href: '/anime', label: 'En emisión' },
]

export default function Footer() {
  return (
    <footer className="footer-premium mt-12">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <Logo size={36} className="logo-mark-svg" />
              <p className="font-display font-bold text-lg text-text">Animédula</p>
            </div>
          </div>
          <div>
            <p className="eyebrow mb-3">Secciones</p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-accent transition">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-3">Legal</p>
            <p className="text-sm text-muted">Enlaces de afiliado.</p>
          </div>
        </div>
        <div className="pt-6 border-t border-white/6 flex flex-wrap items-center justify-between gap-3 text-xs text-faint">
          <span>© {new Date().getFullYear()} Animédula</span>
          <span className="tag tag-sakura">🇲🇽 Hecho en México</span>
        </div>
      </div>
    </footer>
  )
}

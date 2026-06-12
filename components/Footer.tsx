import Link from 'next/link'
import { NAV, NAV_GROUP, SITE, UI } from '../lib/copy'
import Logo from './Logo'

const FOOTER_GROUPS = [
  {
    label: NAV_GROUP.animeManga,
    links: [
      { href: '/explorar', label: NAV.explore },
      { href: '/calendario', label: NAV.seasons },
      { href: '/mangas', label: NAV.manga },
    ],
  },
  {
    label: NAV_GROUP.otaku,
    links: [
      { href: '/videojuegos', label: NAV.gaming },
      { href: '/coleccionables', label: NAV.collect },
      { href: '/tecnologia', label: NAV.tech },
    ],
  },
  {
    label: NAV_GROUP.community,
    links: [{ href: '/comunidad', label: NAV.community }],
  },
]

export default function Footer() {
  return (
    <footer className="footer-premium mt-12">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <Logo size={36} className="logo-mark-svg" />
              <div>
                <p className="font-display font-bold text-lg text-text">{SITE.name}</p>
                <p className="text-sm text-muted mt-1">{SITE.tagline}</p>
              </div>
            </div>
          </div>
          {FOOTER_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="eyebrow mb-3">{group.label}</p>
              <ul className="space-y-2 text-sm text-muted">
                {group.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-accent transition">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="eyebrow mb-3">Legal</p>
            <ul className="space-y-2 text-sm text-muted mb-4">
              <li>
                <Link href="/privacidad" className="hover:text-accent transition">Política de privacidad</Link>
              </li>
              <li>
                <Link href="/terminos" className="hover:text-accent transition">Términos de uso</Link>
              </li>
            </ul>
            <p className="text-sm text-muted leading-relaxed">{UI.affiliateShort}</p>
          </div>
        </div>
        <div className="pt-6 border-t border-white/6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-faint">
          <span>© {new Date().getFullYear()} {SITE.name}</span>
          <div className="flex gap-4">
            <Link href="/privacidad" className="hover:text-accent transition">Privacidad</Link>
            <Link href="/terminos" className="hover:text-accent transition">Términos</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

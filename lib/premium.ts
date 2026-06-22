import type { UserRole } from './auth'

export type PremiumProfileFields = {
  is_premium?: boolean | null
  premium_until?: string | null
  premium_plan?: string | null
  role?: UserRole | string | null
}

/** Premium activo por suscripción o admin (modo prueba). */
export function isPremiumActive(profile: PremiumProfileFields | null | undefined): boolean {
  if (!profile) return false
  if (profile.role === 'admin') return true
  if (!profile.is_premium) return false
  if (!profile.premium_until) return true
  return new Date(profile.premium_until).getTime() > Date.now()
}

export function premiumLabel(profile: PremiumProfileFields | null | undefined): string {
  if (profile?.role === 'admin') return 'Administrador'
  if (profile?.premium_plan === 'animedula-plus') return 'Animédula+'
  if (isPremiumActive(profile)) return 'Premium'
  return 'Gratis'
}

export const PREMIUM_PERKS = [
  { icon: '✦', title: 'Sin anuncios', desc: 'Navega sin banners AdSense en fichas y feed.' },
  { icon: '◇', title: 'Marco de avatar', desc: 'Bordes legendarios y holográficos en tu perfil.' },
  { icon: '🏅', title: 'Insignia Animédula+', desc: 'Badge exclusivo visible en foro y perfil público.' },
  { icon: '🛍', title: 'Tienda ampliada', desc: 'Cosméticos extra y descuentos en monedas (próximamente).' },
] as const

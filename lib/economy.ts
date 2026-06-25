/**
 * Economía del sitio: moneda virtual (MéduCoins) y modos de obtención de premios.
 * Centraliza branding y reglas para que el CMS de admin y el resto del sitio
 * usen los mismos nombres y opciones.
 */

export const CURRENCY = {
  name: 'MéduCoins',
  singular: 'MéduCoin',
  short: 'MC',
}

export type Acquisition = 'purchase' | 'reward' | 'premium' | 'gift'

export const ACQUISITIONS: { id: Acquisition; label: string; help: string; icon: string }[] = [
  { id: 'purchase', label: 'Comprable', help: 'Se compra con MéduCoins en la tienda', icon: '🛒' },
  { id: 'reward', label: 'Por logro / actividad', help: 'Se gana al cumplir una actividad', icon: '🎯' },
  { id: 'premium', label: 'Solo Premium', help: 'Exclusivo para miembros premium', icon: '💎' },
  { id: 'gift', label: 'Regalo / Evento', help: 'Entregado en eventos o manualmente', icon: '🎁' },
]

export const acquisitionById = (id?: string) =>
  ACQUISITIONS.find((a) => a.id === id) || ACQUISITIONS[0]

/** Actividades sugeridas para condiciones de desbloqueo (autocompletar en el CMS) */
export const UNLOCK_ACTIVITIES: string[] = [
  'Publica tu primera reseña',
  'Publica 10 reseñas',
  'Alcanza 100 MéduCoins',
  'Consigue 5 amigos',
  'Completa tu perfil al 100%',
  'Inicia sesión 7 días seguidos',
  'Recibe 50 likes en el foro',
  'Sé miembro Premium',
  'Participa en un evento de temporada',
  'Sube al nivel 10',
]

export function formatCoins(amount: number): string {
  return amount.toLocaleString('es-MX')
}

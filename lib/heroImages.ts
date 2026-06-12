export type HeroVariant = 'anime' | 'manga' | 'calendar' | 'tech' | 'collect' | 'gaming' | 'default'

export type HeroSlide = {
  url: string
  /** Posters MAL son bajos para pantalla completa — se difuminan para evitar pixelado */
  soft: boolean
}

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/${id}?w=2400&q=92&auto=format&fit=crop&fm=webp`

export const HERO_IMAGES: Record<HeroVariant, string[]> = {
  anime: [
    UNSPLASH('photo-1613376042017-0b4c2a89fcb3'),
    UNSPLASH('photo-1540959733332-eab4deabeeaf'),
    UNSPLASH('photo-1528164344705-47542687000d'),
    UNSPLASH('photo-1493976040374-85c8e12f0c0e'),
  ],
  manga: [
    UNSPLASH('photo-1612036781342-eea35d6be7e5'),
    UNSPLASH('photo-1589998059174-4d0c4c4e8f0e'),
    UNSPLASH('photo-1512820790803-83ca734da794'),
  ],
  calendar: [
    UNSPLASH('photo-1507003211169-0a1dd7228f2d'),
    UNSPLASH('photo-1464822759023-fed622ff2c3b'),
    UNSPLASH('photo-1470071459604-3b5ec3a7fe05'),
  ],
  tech: [
    UNSPLASH('photo-1518770660439-4636190af475'),
    UNSPLASH('photo-1550745165-9bc0b252726f'),
    UNSPLASH('photo-1587825140708-28839a3f2b2'),
  ],
  collect: [
    UNSPLASH('photo-1612036781342-eea35d6be7e5'),
    UNSPLASH('photo-1606107557192-0beaec7a82b8'),
    UNSPLASH('photo-1558618666-fcd25c85cd64'),
  ],
  gaming: [
    UNSPLASH('photo-1542751371-adc38448a05e'),
    UNSPLASH('photo-1511512578047-dfb367046420'),
    UNSPLASH('photo-1493711662062-fa541adb3fc8'),
  ],
  default: [
    UNSPLASH('photo-1613376042017-0b4c2a89fcb3'),
    UNSPLASH('photo-1540959733332-eab4deabeeaf'),
  ],
}

export function isPosterUrl(url: string) {
  return /myanimelist\.net/i.test(url)
}

export function toHeroSlide(url: string): HeroSlide {
  return { url, soft: isPosterUrl(url) }
}

export function pickHeroImages(variant: HeroVariant, fromApi?: (string | undefined | null)[]): HeroSlide[] {
  const api = [...new Set((fromApi || []).filter((u): u is string => Boolean(u)))]
  if (api.length >= 2) return api.slice(0, 8).map(toHeroSlide)
  return HERO_IMAGES[variant].map(toHeroSlide)
}

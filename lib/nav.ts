import type { IconName } from '../components/icons/SectionIcon'
import { NAV, NAV_GROUP } from './copy'

export type NavItem = {
  href: string
  label: string
  description?: string
  icon: IconName
  match?: (p: string) => boolean
}

export type NavGroup = {
  id: string
  label: string
  icon: IconName
  items: NavItem[]
}

export type NavEntry =
  | { type: 'link'; item: NavItem }
  | { type: 'group'; group: NavGroup }

const ANIME_MANGA_ITEMS: NavItem[] = [
  {
    href: '/explorar',
    label: NAV.explore,
    description: 'Rankings y fichas de anime',
    icon: 'explore',
    match: (p) => p.startsWith('/explorar'),
  },
  {
    href: '/calendario',
    label: NAV.seasons,
    description: 'En emisión y próximos estrenos',
    icon: 'calendar',
    match: (p) => p.startsWith('/calendario') || p === '/anime',
  },
  {
    href: '/mangas',
    label: NAV.manga,
    description: 'Top mangas y tomos',
    icon: 'manga',
    match: (p) => p.startsWith('/mangas'),
  },
  {
    href: '/ver',
    label: 'Ver anime',
    description: 'Reproductor de episodios',
    icon: 'play',
    match: (p) => p.startsWith('/ver'),
  },
]

const OTAKU_ITEMS: NavItem[] = [
  {
    href: '/videojuegos',
    label: NAV.gaming,
    description: 'Juegos gratis y noticias',
    icon: 'game',
    match: (p) => p.startsWith('/videojuegos'),
  },
  {
    href: '/coleccionables',
    label: NAV.collect,
    description: 'Figuras, TCG y merch',
    icon: 'collect',
    match: (p) => p.startsWith('/coleccionables'),
  },
  {
    href: '/tecnologia',
    label: NAV.tech,
    description: 'Equipo y gadgets',
    icon: 'tech',
    match: (p) => p.startsWith('/tecnologia'),
  },
]

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'anime-manga',
    label: NAV_GROUP.animeManga,
    icon: 'anime',
    items: ANIME_MANGA_ITEMS,
  },
  {
    id: 'otaku',
    label: NAV_GROUP.otaku,
    icon: 'sparkle',
    items: OTAKU_ITEMS,
  },
]

export const NAV_MENU: NavEntry[] = [
  {
    type: 'link',
    item: {
      href: '/',
      label: NAV.home,
      icon: 'home',
      match: (p) => p === '/',
    },
  },
  { type: 'group', group: NAV_GROUPS[0]! },
  { type: 'group', group: NAV_GROUPS[1]! },
  {
    type: 'link',
    item: {
      href: '/noticias',
      label: NAV.news,
      icon: 'sparkle',
      match: (p) => p.startsWith('/noticias'),
    },
  },
  {
    type: 'link',
    item: {
      href: '/comunidad',
      label: NAV.community,
      icon: 'sparkle',
      match: (p) => p.startsWith('/comunidad'),
    },
  },
]

export const MOBILE_NAV: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      {
        href: '/',
        label: NAV.home,
        icon: 'home',
        match: (p) => p === '/',
      },
    ],
  },
  { label: NAV_GROUP.animeManga, items: ANIME_MANGA_ITEMS },
  { label: NAV_GROUP.otaku, items: OTAKU_ITEMS },
  {
    label: NAV_GROUP.community,
    items: [
      {
        href: '/noticias',
        label: NAV.news,
        icon: 'sparkle',
        match: (p) => p.startsWith('/noticias'),
      },
      {
        href: '/comunidad',
        label: NAV.community,
        icon: 'sparkle',
        match: (p) => p.startsWith('/comunidad'),
      },
    ],
  },
]

export function isNavActive(href: string, path: string, match?: (p: string) => boolean) {
  if (match) return match(path)
  return path === href || path.startsWith(`${href}/`)
}

export function isGroupActive(group: NavGroup, path: string) {
  return group.items.some((item) => isNavActive(item.href, path, item.match))
}

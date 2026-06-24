/** Stickers del foro — token en texto: :id: */

export type StickerDef = {
  id: string
  emoji: string
  label: string
  pack: string
}

export const STICKER_PACKS: Record<string, StickerDef[]> = {
  'stickers-otaku': [
    { id: 'waifu', emoji: '💕', label: 'Waifu', pack: 'stickers-otaku' },
    { id: 'nakama', emoji: '🤝', label: 'Nakama', pack: 'stickers-otaku' },
    { id: 'senpai', emoji: '🎓', label: 'Senpai', pack: 'stickers-otaku' },
    { id: 'baka', emoji: '😤', label: 'Baka', pack: 'stickers-otaku' },
    { id: 'sugoi', emoji: '✨', label: 'Sugoi', pack: 'stickers-otaku' },
    { id: 'nani', emoji: '⁉️', label: 'Nani', pack: 'stickers-otaku' },
  ],
  'stickers-premium': [
    { id: 'legend', emoji: '👑', label: 'Legendario', pack: 'stickers-premium' },
    { id: 'holo', emoji: '🌈', label: 'Holo', pack: 'stickers-premium' },
    { id: 'sakura', emoji: '🌸', label: 'Sakura', pack: 'stickers-premium' },
    { id: 'katana', emoji: '⚔️', label: 'Katana', pack: 'stickers-premium' },
  ],
}

/** Stickers gratis para todos */
export const FREE_STICKERS: StickerDef[] = [
  { id: 'fire', emoji: '🔥', label: 'Hype', pack: 'free' },
  { id: 'gg', emoji: '🏆', label: 'GG', pack: 'free' },
  { id: 'cry', emoji: '😢', label: 'Sad', pack: 'free' },
  { id: 'lol', emoji: '😂', label: 'LOL', pack: 'free' },
]

const ALL_STICKERS = [...FREE_STICKERS, ...Object.values(STICKER_PACKS).flat()]
const STICKER_MAP = Object.fromEntries(ALL_STICKERS.map((s) => [s.id, s]))

export function stickersForOwnedPacks(ownedSlugs: string[]): StickerDef[] {
  const list = [...FREE_STICKERS]
  for (const slug of ownedSlugs) {
    const pack = STICKER_PACKS[slug]
    if (pack) list.push(...pack)
  }
  return list
}

export function insertStickerToken(body: string, stickerId: string): string {
  const token = ` :${stickerId}: `
  return body ? `${body.trimEnd()}${token}` : `:${stickerId}:`
}

const TOKEN_RE = /:([a-z0-9_-]+):/g

export function renderForumBody(body: string): string {
  return body.replace(TOKEN_RE, (_, id: string) => {
    const s = STICKER_MAP[id]
    if (!s) return `:${id}:`
    return `<span class="forum-sticker" title="${s.label}">${s.emoji}</span>`
  })
}

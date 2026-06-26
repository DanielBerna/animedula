import { FREE_STICKERS } from '../../../lib/gamification/stickers'
import { getSupabaseAdmin, isSupabaseConfigured } from '../../../lib/supabaseAdmin'

export const revalidate = 10

type StickerDef = { id: string; emoji: string | null; image: string | null; label: string; pack: string; free: boolean }

/**
 * Fuente única de stickers del sitio: combina los gratis (código) con los packs
 * creados en el CMS de admin (shop_items.metadata.stickers). Soporta emoji o imagen.
 * Público: las definiciones se usan para renderizar el foro.
 */
export async function GET() {
  const base: StickerDef[] = FREE_STICKERS.map((s) => ({
    id: s.id,
    emoji: s.emoji,
    image: null,
    label: s.label,
    pack: 'free',
    free: true,
  }))

  if (!isSupabaseConfigured()) {
    return Response.json({ stickers: base })
  }

  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from('shop_items')
    .select('slug, item_type, metadata')
    .eq('item_type', 'sticker_pack')

  const out: StickerDef[] = [...base]
  const seen = new Set(base.map((s) => s.id))

  for (const item of data || []) {
    const meta =
      (item.metadata as {
        stickers?: { id: string; emoji?: string; image?: string; label: string }[]
        acquisition?: string
        active?: boolean
      }) || {}
    if (meta.active === false) continue
    const isFreePack = meta.acquisition === 'free'
    for (const s of meta.stickers || []) {
      if (!s.id || seen.has(s.id)) continue
      seen.add(s.id)
      out.push({
        id: s.id,
        emoji: s.emoji || null,
        image: s.image || null,
        label: s.label || s.id,
        pack: item.slug,
        free: isFreePack,
      })
    }
  }

  return Response.json({ stickers: out })
}

import { createServiceClient } from '../supabase/service'

/** Marco equipado: puede ser una clase CSS o una imagen (PNG con transparencia). */
export type EquippedBorder = {
  cssClass: string | null
  image: string | null
}

type ShopItemJoin = {
  css_class?: string | null
  item_type?: string
  asset_url?: string | null
  metadata?: { border_style?: string } | null
}

function toBorder(item: ShopItemJoin | null): EquippedBorder | null {
  if (!item || item.item_type !== 'avatar_border') return null
  const isImage = item.metadata?.border_style === 'image' || (!!item.asset_url && !item.css_class)
  if (isImage && item.asset_url) {
    return { cssClass: null, image: item.asset_url }
  }
  if (item.css_class) {
    return { cssClass: item.css_class, image: null }
  }
  return null
}

/** user_id → marco equipado (clase CSS o imagen) */
export async function getEquippedBordersForUsers(
  userIds: string[],
): Promise<Record<string, EquippedBorder>> {
  const supabase = createServiceClient()
  if (!supabase || userIds.length === 0) return {}

  const unique = [...new Set(userIds)]
  const { data } = await supabase
    .from('user_inventory')
    .select('user_id, shop_items(css_class, item_type, asset_url, metadata)')
    .in('user_id', unique)
    .eq('equipped', true)

  const map: Record<string, EquippedBorder> = {}
  for (const row of data || []) {
    const border = toBorder(row.shop_items as ShopItemJoin | null)
    if (border) map[row.user_id] = border
  }
  return map
}

export async function getEquippedBorderForUser(userId: string): Promise<EquippedBorder | null> {
  const map = await getEquippedBordersForUsers([userId])
  return map[userId] ?? null
}

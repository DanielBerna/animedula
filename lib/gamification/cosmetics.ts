import { createServiceClient } from '../supabase/service'

/** user_id → css_class del borde equipado */
export async function getEquippedBordersForUsers(userIds: string[]): Promise<Record<string, string>> {
  const supabase = createServiceClient()
  if (!supabase || userIds.length === 0) return {}

  const unique = [...new Set(userIds)]
  const { data } = await supabase
    .from('user_inventory')
    .select('user_id, shop_items(css_class, item_type)')
    .in('user_id', unique)
    .eq('equipped', true)

  const map: Record<string, string> = {}
  for (const row of data || []) {
    const item = row.shop_items as { css_class?: string | null; item_type?: string } | null
    if (item?.item_type === 'avatar_border' && item.css_class) {
      map[row.user_id] = item.css_class
    }
  }
  return map
}

export async function getEquippedBorderForUser(userId: string): Promise<string | null> {
  const map = await getEquippedBordersForUsers([userId])
  return map[userId] ?? null
}

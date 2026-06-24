import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../lib/auth'
import { createClient, isSupabaseAuthConfigured } from '../../../lib/supabase/server'
import { requireRateLimit } from '../../../lib/security/api'

export async function GET() {
  if (!isSupabaseAuthConfigured()) {
    return Response.json({ titles: [], badges: [], inventory: [] })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ titles: [], badges: [], inventory: [] })

  const supabase = await createClient()
  const [{ data: profile }, { data: titles }, { data: badges }, { data: inventory }, { data: shop }] =
    await Promise.all([
      supabase.from('profiles').select('level, selected_title, coins').eq('id', user.id).maybeSingle(),
      supabase.from('selectable_titles').select('slug, name, min_level').order('min_level'),
      supabase
        .from('user_badges')
        .select('unlocked_at, badges(slug, name, description, category)')
        .eq('user_id', user.id),
      supabase
        .from('user_inventory')
        .select('equipped, shop_items(slug, name, css_class, item_type)')
        .eq('user_id', user.id),
      supabase.from('shop_items').select('id, slug, name, description, price_coins, item_type, css_class'),
    ])

  const level = profile?.level ?? 1
  const availableTitles = (titles || []).filter((t) => t.min_level <= level)

  const equipped = (inventory || []).find((i) => i.equipped)
  const equippedSlug =
    equipped && equipped.shop_items && !Array.isArray(equipped.shop_items)
      ? (equipped.shop_items as { slug?: string }).slug ?? null
      : null

  return Response.json({
    level,
    coins: profile?.coins ?? 0,
    selected_title: profile?.selected_title,
    titles: availableTitles,
    badges: badges || [],
    inventory: inventory || [],
    shop: shop || [],
    equipped_slug: equippedSlug,
  })
}

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'mutation', 'gamification')
  if (limited) return limited

  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'No disponible' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const body = await req.json()
  const supabase = await createClient()

  if (body.action === 'select_title') {
    const slug = String(body.slug || '')
    const { data: title } = await supabase
      .from('selectable_titles')
      .select('name, min_level')
      .eq('slug', slug)
      .maybeSingle()
    if (!title) return Response.json({ error: 'Título no encontrado' }, { status: 404 })

    const { data: profile } = await supabase.from('profiles').select('level').eq('id', user.id).maybeSingle()
    if ((profile?.level ?? 1) < title.min_level) {
      return Response.json({ error: 'Nivel insuficiente' }, { status: 403 })
    }

    await supabase.from('profiles').update({ selected_title: title.name }).eq('id', user.id)
    return Response.json({ ok: true, title: title.name })
  }

  if (body.action === 'buy') {
    const slug = String(body.slug || '').slice(0, 80)
    const { data, error: buyErr } = await supabase.rpc('purchase_shop_item', {
      p_item_slug: slug,
    })

    if (buyErr) {
      const msg = buyErr.message || ''
      if (msg.includes('item_not_found')) {
        return Response.json({ error: 'Artículo no encontrado' }, { status: 404 })
      }
      if (msg.includes('already_owned')) {
        return Response.json({ error: 'Ya lo tienes' }, { status: 409 })
      }
      if (msg.includes('insufficient_coins')) {
        return Response.json({ error: 'Monedas insuficientes' }, { status: 402 })
      }
      return Response.json({ error: 'No se pudo completar la compra' }, { status: 500 })
    }

    return Response.json({ ok: true, ...((data as object) || {}) })
  }

  if (body.action === 'equip') {
    const slug = String(body.slug || '')
    const { data: owned } = await supabase
      .from('user_inventory')
      .select('id, shop_items!inner(slug, item_type)')
      .eq('user_id', user.id)
      .eq('shop_items.slug', slug)
      .maybeSingle()

    if (!owned) return Response.json({ error: 'No posees este artículo' }, { status: 404 })

    const itemType = (owned.shop_items as { item_type?: string })?.item_type
    if (itemType === 'avatar_border') {
      const { data: allBorders } = await supabase
        .from('user_inventory')
        .select('id, shop_items!inner(item_type)')
        .eq('user_id', user.id)
        .eq('equipped', true)

      const borderIds = (allBorders || [])
        .filter((r) => (r.shop_items as { item_type?: string })?.item_type === 'avatar_border')
        .map((r) => r.id)

      if (borderIds.length > 0) {
        await supabase.from('user_inventory').update({ equipped: false }).in('id', borderIds)
      }
    }

    await supabase.from('user_inventory').update({ equipped: true }).eq('id', owned.id)
    return Response.json({ ok: true })
  }

  return Response.json({ error: 'Acción no válida' }, { status: 400 })
}

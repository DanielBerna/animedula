import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../lib/auth'
import { createClient, isSupabaseAuthConfigured } from '../../../lib/supabase/server'

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

  return Response.json({
    level,
    coins: profile?.coins ?? 0,
    selected_title: profile?.selected_title,
    titles: availableTitles,
    badges: badges || [],
    inventory: inventory || [],
    shop: shop || [],
  })
}

export async function POST(req: NextRequest) {
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
    const slug = String(body.slug || '')
    const { data: item } = await supabase.from('shop_items').select('*').eq('slug', slug).maybeSingle()
    if (!item) return Response.json({ error: 'Artículo no encontrado' }, { status: 404 })

    const { data: profile } = await supabase.from('profiles').select('coins').eq('id', user.id).maybeSingle()
    if ((profile?.coins ?? 0) < item.price_coins) {
      return Response.json({ error: 'Monedas insuficientes' }, { status: 402 })
    }

    const { error: buyErr } = await supabase.from('user_inventory').insert({
      user_id: user.id,
      item_id: item.id,
    })
    if (buyErr) {
      if (buyErr.code === '23505') return Response.json({ error: 'Ya lo tienes' }, { status: 409 })
      return Response.json({ error: buyErr.message }, { status: 500 })
    }

    await supabase
      .from('profiles')
      .update({ coins: (profile?.coins ?? 0) - item.price_coins })
      .eq('id', user.id)

    return Response.json({ ok: true })
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

    await supabase.from('user_inventory').update({ equipped: false }).eq('user_id', user.id)
    await supabase.from('user_inventory').update({ equipped: true }).eq('id', owned.id)
    return Response.json({ ok: true })
  }

  return Response.json({ error: 'Acción no válida' }, { status: 400 })
}

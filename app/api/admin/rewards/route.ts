import { NextRequest } from 'next/server'
import { requireEditor } from '../../../../lib/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabaseAdmin'
import { requireRateLimit } from '../../../../lib/security/api'
import { isAiDesignEnabled } from '../../../../lib/design/generate'

export async function GET() {
  const editor = await requireEditor()
  if (!editor) return Response.json({ error: 'No autorizado' }, { status: 403 })
  const aiEnabled = isAiDesignEnabled()
  if (!isSupabaseConfigured()) return Response.json({ shop: [], badges: [], aiEnabled })

  const admin = getSupabaseAdmin()
  const [shop, badges] = await Promise.all([
    admin
      .from('shop_items')
      .select('id, slug, name, description, price_coins, item_type, css_class, asset_url, metadata, sort_order')
      .order('sort_order')
      .order('price_coins'),
    admin
      .from('badges')
      .select('id, slug, name, description, category, icon_url, is_active, metadata, sort_order')
      .order('sort_order')
      .order('slug'),
  ])

  return Response.json({ shop: shop.data || [], badges: badges.data || [], aiEnabled })
}

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'mutation', 'admin-rewards')
  if (limited) return limited

  const editor = await requireEditor()
  if (!editor) return Response.json({ error: 'No autorizado' }, { status: 403 })
  if (!isSupabaseConfigured()) return Response.json({ error: 'No disponible' }, { status: 503 })

  const body = await req.json()
  const kind = body.kind as 'shop_item' | 'badge'
  const admin = getSupabaseAdmin()

  if (kind === 'shop_item') {
    const slug = String(body.slug || '')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .slice(0, 40)
    const payload = {
      slug,
      name: String(body.name || '').slice(0, 80),
      description: String(body.description || '').slice(0, 300),
      price_coins: Math.max(1, Number(body.price_coins) || 50),
      item_type: body.item_type === 'sticker_pack' ? 'sticker_pack' : 'avatar_border',
      css_class: body.css_class ? String(body.css_class).slice(0, 80) : null,
      asset_url: body.asset_url ? String(body.asset_url) : '',
      metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
      sort_order: Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0,
    }
    if (!slug || !payload.name) return Response.json({ error: 'Slug y nombre requeridos' }, { status: 400 })

    const { error } = await admin.from('shop_items').upsert(payload, { onConflict: 'slug' })
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true, slug })
  }

  if (kind === 'badge') {
    const slug = String(body.slug || '')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .slice(0, 40)
    const payload = {
      slug,
      name: String(body.name || '').slice(0, 80),
      description: String(body.description || '').slice(0, 300),
      category: String(body.category || 'general').slice(0, 40),
      icon_url: body.icon_url ? String(body.icon_url) : '',
      is_active: body.is_active !== false,
      metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
      sort_order: Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0,
    }
    if (!slug || !payload.name) return Response.json({ error: 'Slug y nombre requeridos' }, { status: 400 })

    const { error } = await admin.from('badges').upsert(payload, { onConflict: 'slug' })
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true, slug })
  }

  return Response.json({ error: 'kind inválido' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const limited = await requireRateLimit(req, 'mutation', 'admin-rewards-delete')
  if (limited) return limited

  const editor = await requireEditor()
  if (!editor) return Response.json({ error: 'No autorizado' }, { status: 403 })
  if (!isSupabaseConfigured()) return Response.json({ error: 'No disponible' }, { status: 503 })

  const url = new URL(req.url)
  const kind = url.searchParams.get('kind')
  const slug = url.searchParams.get('slug')
  if (!slug) return Response.json({ error: 'Falta slug' }, { status: 400 })

  const admin = getSupabaseAdmin()
  const table = kind === 'badge' ? 'badges' : 'shop_items'
  const { error } = await admin.from(table).delete().eq('slug', slug)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

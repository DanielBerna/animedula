import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../lib/auth'
import { createClient, isSupabaseAuthConfigured } from '../../../lib/supabase/server'
import { validateImageBuffer } from '../../../lib/security/image'
import { requireRateLimit } from '../../../lib/security/api'

const VALID_TYPES = ['anime', 'manga', 'game', 'movie'] as const
const MAX_BYTES = 4 * 1024 * 1024
const DAILY_UPLOAD_LIMIT = 20

export async function GET(req: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    return Response.json({ screenshots: [] })
  }

  const url = new URL(req.url)
  const content_type = url.searchParams.get('content_type') || ''
  const content_id = url.searchParams.get('content_id') || ''

  if (!VALID_TYPES.includes(content_type as typeof VALID_TYPES[number]) || !content_id) {
    return Response.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('content_screenshots')
    .select('id, storage_path, caption, created_at, user_id, profiles(display_name)')
    .eq('content_type', content_type)
    .eq('content_id', content_id)
    .order('created_at', { ascending: false })
    .limit(24)

  if (error) {
    if (error.code === '42P01') {
      return Response.json({ screenshots: [], hint: 'Ejecuta schema-v7-screenshots.sql' })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const screenshots = (data || []).map((row) => {
    const profile = row.profiles as { display_name?: string } | null
    const publicUrl = base
      ? `${base}/storage/v1/object/public/captures/${row.storage_path}`
      : ''
    return {
      id: row.id,
      url: publicUrl,
      caption: row.caption,
      created_at: row.created_at,
      author: profile?.display_name || 'Fan',
    }
  })

  return Response.json({ screenshots })
}

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'upload', 'screenshots')
  if (limited) return limited

  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'Capturas no disponibles' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const content_type = String(form.get('content_type') || '')
  const content_id = String(form.get('content_id') || '')
  const caption = String(form.get('caption') || '').slice(0, 200)

  if (!file || !VALID_TYPES.includes(content_type as typeof VALID_TYPES[number]) || !content_id) {
    return Response.json({ error: 'Datos incompletos' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: 'Máximo 4 MB por imagen' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return Response.json({ error: 'Solo imágenes' }, { status: 400 })
  }

  const supabase = await createClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { count: uploadsToday } = await supabase
    .from('content_screenshots')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', todayStart.toISOString())

  if ((uploadsToday ?? 0) >= DAILY_UPLOAD_LIMIT) {
    return Response.json({ error: 'Límite diario de capturas alcanzado' }, { status: 429 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const validated = validateImageBuffer(buffer, file.type)
  if (!validated.ok) {
    return Response.json({ error: 'Archivo de imagen no válido' }, { status: 400 })
  }

  const ext = validated.mime.includes('png') ? 'png' : validated.mime.includes('webp') ? 'webp' : 'jpg'
  const storage_path = `${user.id}/${content_type}/${content_id}/${Date.now()}.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('captures')
    .upload(storage_path, buffer, { contentType: validated.mime, upsert: false })

  if (uploadErr) {
    return Response.json(
      { error: uploadErr.message.includes('Bucket') ? 'Crea el bucket "captures" en Supabase Storage' : uploadErr.message },
      { status: 500 },
    )
  }

  const { data, error } = await supabase
    .from('content_screenshots')
    .insert({
      user_id: user.id,
      content_type,
      content_id,
      storage_path,
      caption: caption || null,
    })
    .select('id')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ id: data.id })
}

import { NextRequest } from 'next/server'
import { requireEditor } from '../../../../../lib/auth'
import { createClient, isSupabaseAuthConfigured } from '../../../../../lib/supabase/server'
import { validateImageBuffer } from '../../../../../lib/security/image'
import { requireRateLimit } from '../../../../../lib/security/api'

const MAX_BYTES = 2 * 1024 * 1024

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'upload', 'admin-rewards-upload')
  if (limited) return limited

  const editor = await requireEditor()
  if (!editor) return Response.json({ error: 'No autorizado' }, { status: 403 })

  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'No disponible' }, { status: 503 })
  }

  const form = await req.formData()
  const file = form.get('file') as File | null
  const folder = String(form.get('folder') || 'misc').replace(/[^a-z0-9-]/gi, '')

  if (!file) return Response.json({ error: 'Falta imagen' }, { status: 400 })
  if (file.size > MAX_BYTES) return Response.json({ error: 'Máximo 2 MB' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const validated = validateImageBuffer(buffer, file.type)
  if (!validated.ok) return Response.json({ error: 'Imagen no válida' }, { status: 400 })

  const ext = validated.mime.includes('png') ? 'png' : validated.mime.includes('webp') ? 'webp' : 'jpg'
  const name = `${folder}/${Date.now()}.${ext}`

  const supabase = await createClient()
  const { error: uploadErr } = await supabase.storage
    .from('rewards')
    .upload(name, buffer, { contentType: validated.mime, upsert: false })

  if (uploadErr) {
    return Response.json(
      {
        error: uploadErr.message.includes('Bucket')
          ? 'Crea el bucket público "rewards" en Supabase Storage'
          : uploadErr.message,
      },
      { status: 500 },
    )
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const url = base ? `${base}/storage/v1/object/public/rewards/${name}` : name
  return Response.json({ ok: true, url })
}

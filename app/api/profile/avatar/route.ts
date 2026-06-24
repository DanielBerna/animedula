import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../../lib/auth'
import { createClient, isSupabaseAuthConfigured } from '../../../../lib/supabase/server'
import { validateImageBuffer } from '../../../../lib/security/image'
import { requireRateLimit } from '../../../../lib/security/api'
import { isAllowedAvatarUrl } from '../../../../lib/security/urls'

const MAX_BYTES = 2 * 1024 * 1024

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'upload', 'profile-avatar')
  if (limited) return limited

  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'No disponible' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null

  if (!file) return Response.json({ error: 'Falta la imagen' }, { status: 400 })
  if (file.size > MAX_BYTES) return Response.json({ error: 'Máximo 2 MB' }, { status: 400 })
  if (!file.type.startsWith('image/')) return Response.json({ error: 'Solo imágenes' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const validated = validateImageBuffer(buffer, file.type)
  if (!validated.ok) {
    return Response.json({ error: 'Archivo de imagen no válido' }, { status: 400 })
  }

  const ext = validated.mime.includes('png') ? 'png' : validated.mime.includes('webp') ? 'webp' : 'jpg'
  const storage_path = `${user.id}/avatar.${ext}`

  const supabase = await createClient()
  const { error: uploadErr } = await supabase.storage
    .from('avatars')
    .upload(storage_path, buffer, { contentType: validated.mime, upsert: true })

  if (uploadErr) {
    return Response.json(
      {
        error: uploadErr.message.includes('Bucket')
          ? 'Crea el bucket público "avatars" en Supabase Storage'
          : uploadErr.message,
      },
      { status: 500 },
    )
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const avatar_url = base ? `${base}/storage/v1/object/public/avatars/${storage_path}` : storage_path

  if (!isAllowedAvatarUrl(avatar_url) && !avatar_url.includes('.supabase.co')) {
    return Response.json({ error: 'URL de avatar no permitida' }, { status: 400 })
  }

  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ avatar_url })
    .eq('id', user.id)

  if (profileErr) return Response.json({ error: profileErr.message }, { status: 500 })

  return Response.json({ ok: true, avatar_url })
}

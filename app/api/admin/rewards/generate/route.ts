import { NextRequest } from 'next/server'
import { requireEditor } from '../../../../../lib/auth'
import { createClient, isSupabaseAuthConfigured } from '../../../../../lib/supabase/server'
import { validateImageBuffer } from '../../../../../lib/security/image'
import { requireRateLimit } from '../../../../../lib/security/api'
import { generateRewardImage, type RewardType } from '../../../../../lib/design/generate'

const TYPES: RewardType[] = ['sticker', 'border', 'badge']

export async function POST(req: NextRequest) {
  // Tier 'upload' (8/5min) — limita el gasto en IA.
  const limited = await requireRateLimit(req, 'upload', 'admin-rewards-generate')
  if (limited) return limited

  const editor = await requireEditor()
  if (!editor) return Response.json({ error: 'No autorizado' }, { status: 403 })

  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'No disponible' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const prompt = String(body.prompt || '').trim()
  const type = (TYPES.includes(body.type) ? body.type : 'sticker') as RewardType
  const sketchUrl = body.sketchUrl ? String(body.sketchUrl) : null
  const removeBg = body.removeBg === true

  if (prompt.length < 3) {
    return Response.json({ error: 'Escribe una descripción más larga' }, { status: 400 })
  }

  const gen = await generateRewardImage({ prompt, type, sketchUrl, removeBg })
  if (gen.ok === false) return Response.json({ error: gen.error }, { status: 502 })

  const validated = validateImageBuffer(gen.buffer, gen.mime)
  if (!validated.ok) return Response.json({ error: 'La imagen generada no es válida' }, { status: 502 })

  const name = `ai/${type}-${Date.now()}.png`
  const supabase = await createClient()
  const { error: uploadErr } = await supabase.storage
    .from('rewards')
    .upload(name, gen.buffer, { contentType: 'image/png', upsert: false })

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
  return Response.json({ ok: true, url, removedBg: gen.removedBg === true, wantedBg: removeBg })
}

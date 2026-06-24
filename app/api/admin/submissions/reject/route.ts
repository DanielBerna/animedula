import { NextRequest } from 'next/server'
import { requireEditor } from '../../../../../lib/auth'
import { setSubmissionStatus } from '../../../../../lib/editorial/submissions'
import { isSupabaseAuthConfigured } from '../../../../../lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseAuthConfigured()) {
      return Response.json({ error: 'Supabase no configurado' }, { status: 503 })
    }

    const editor = await requireEditor()
    if (!editor) return Response.json({ error: 'No autorizado' }, { status: 403 })

    const body = await req.json()
    const id = String(body.id || '')
    if (!id) return Response.json({ error: 'Falta id' }, { status: 400 })

    await setSubmissionStatus(id, 'rejected')
    return Response.json({ ok: true })
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}

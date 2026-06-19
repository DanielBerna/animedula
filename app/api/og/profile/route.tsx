import { ImageResponse } from 'next/og'
import { createServiceClient } from '../../../../lib/supabase/service'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const usernameParam = searchParams.get('username')

  let name = 'Fan de Animédula'
  let level = 1
  let title = 'Novato'
  let badgeName = ''
  let xp = 0
  let userId = id

  const supabase = createServiceClient()
  if (supabase && (id || usernameParam)) {
    let query = supabase
      .from('profiles')
      .select('id, display_name, level, selected_title, xp')
      .limit(1)

    if (usernameParam) {
      query = query.eq('username', usernameParam.toLowerCase())
    } else if (id) {
      query = query.eq('id', id)
    }

    const { data: profile } = await query.maybeSingle()

    if (profile) {
      userId = profile.id
      name = profile.display_name || name
      level = profile.level ?? 1
      title = profile.selected_title || title
      xp = profile.xp ?? 0
    }

    if (userId) {
      const { data: badge } = await supabase
        .from('user_badges')
        .select('badges(name)')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const b = badge?.badges as { name?: string } | null
      if (b?.name) badgeName = b.name
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 48,
          background: 'linear-gradient(135deg, #0f0a1a 0%, #1a1030 50%, #0d1520 100%)',
          color: '#f8fafc',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.7, marginBottom: 8 }}>Animédula</div>
        <div style={{ fontSize: 56, fontWeight: 800, marginBottom: 16 }}>{name}</div>
        <div style={{ display: 'flex', gap: 16, fontSize: 28 }}>
          <span>Nivel {level}</span>
          <span>·</span>
          <span>{title}</span>
          <span>·</span>
          <span>{xp} XP</span>
        </div>
        {badgeName ? (
          <div style={{ marginTop: 24, fontSize: 24, color: '#fbbf24' }}>🏅 {badgeName}</div>
        ) : null}
      </div>
    ),
    { width: 1200, height: 630 },
  )
}

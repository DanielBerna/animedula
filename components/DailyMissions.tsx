'use client'

import { useEffect, useState } from 'react'
import { DAILY_MISSIONS } from '../lib/gamification/missions'
import MeduCoin from './MeduCoin'

type MissionState = {
  key: string
  label: string
  coins: number
  completed: boolean
}

export default function DailyMissions() {
  const [missions, setMissions] = useState<MissionState[]>([])
  const [coins, setCoins] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const res = await fetch('/api/missions')
    const data = await res.json()
    setMissions(data.missions?.length ? data.missions : DAILY_MISSIONS.map((m) => ({ ...m, completed: false })))
    setCoins(data.coins ?? 0)
    setLoading(false)
  }

  useEffect(() => {
    load().then(() => {
      fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mission_key: 'visit' }),
      }).then(() => load())
    })
  }, [])

  const claim = async (key: string) => {
    await fetch('/api/missions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mission_key: key }),
    })
    await load()
  }

  if (loading) return <p className="text-sm text-muted">Cargando misiones…</p>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-text">Misiones diarias</h3>
        <span className="tag tag-gold"><MeduCoin amount={coins} size={14} /> MéduCoins</span>
      </div>
      <ul className="space-y-2">
        {missions.map((m) => (
          <li key={m.key} className="flex items-center justify-between gap-3 text-sm">
            <span className={m.completed ? 'text-faint line-through' : 'text-muted'}>{m.label}</span>
            {m.completed ? (
              <span className="text-xs text-faint">✓ +{m.coins}</span>
            ) : (
              <button type="button" className="btn-ghost text-xs py-1 px-2" onClick={() => claim(m.key)}>
                Reclamar +{m.coins}
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-faint">
        Comenta, reseña, participa en el foro o actualiza tu lista. Reclama monedas en /perfil.
      </p>
    </div>
  )
}

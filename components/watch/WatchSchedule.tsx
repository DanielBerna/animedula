'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Item = {
  mal_id: number
  title: string
  image?: string
  episodes?: number | null
  time?: string | null
}

const DAYS: { key: string; label: string }[] = [
  { key: 'monday', label: 'Lun' },
  { key: 'tuesday', label: 'Mar' },
  { key: 'wednesday', label: 'Mié' },
  { key: 'thursday', label: 'Jue' },
  { key: 'friday', label: 'Vie' },
  { key: 'saturday', label: 'Sáb' },
  { key: 'sunday', label: 'Dom' },
]

const JS_DAY_TO_KEY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export default function WatchSchedule() {
  const [day, setDay] = useState<string>(() => JS_DAY_TO_KEY[new Date().getDay()])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [cache, setCache] = useState<Record<string, Item[]>>({})

  useEffect(() => {
    if (cache[day]) {
      setItems(cache[day])
      setLoading(false)
      return
    }
    setLoading(true)
    let active = true
    fetch(`https://api.jikan.moe/v4/schedules?filter=${day}&limit=20&sfw=true`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return
        const list: Item[] = (d?.data || []).map((it: any) => ({
          mal_id: it.mal_id,
          title: it.title,
          image: it.images?.webp?.image_url || it.images?.jpg?.image_url,
          episodes: it.episodes,
          time: it.broadcast?.time || null,
        }))
        setCache((c) => ({ ...c, [day]: list }))
        setItems(list)
      })
      .catch(() => active && setItems([]))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [day, cache])

  return (
    <section>
      <h2 className="season-label mb-3"><span>Horario semanal</span></h2>
      <div className="watch-day-tabs">
        {DAYS.map((d) => (
          <button
            type="button"
            key={d.key}
            className={`watch-day-tab${day === d.key ? ' is-active' : ''}`}
            onClick={() => setDay(d.key)}
          >
            {d.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted mt-4">Cargando horario…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted mt-4">No hay estrenos listados para este día.</p>
      ) : (
        <div className="watch-grid mt-4">
          {items.map((a) => (
            <Link key={a.mal_id} href={`/ver/${a.mal_id}`} className="watch-card">
              <div className="watch-card-poster">
                {a.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.image} alt="" loading="lazy" />
                ) : null}
                <span className="watch-card-play" aria-hidden>▶</span>
                {a.time ? <span className="watch-card-time">{a.time}</span> : null}
              </div>
              <p className="watch-card-title">{a.title}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

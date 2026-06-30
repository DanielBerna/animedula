'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type Result = {
  mal_id: number
  title: string
  image?: string
  episodes?: number | null
  year?: number | null
  type?: string
}

export default function WatchSearch() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    const term = q.trim()
    if (term.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(term)}&limit=12&sfw=true&order_by=popularity`,
        )
        const data = await res.json()
        const items: Result[] = (data?.data || []).map((it: any) => ({
          mal_id: it.mal_id,
          title: it.title,
          image: it.images?.webp?.image_url || it.images?.jpg?.image_url,
          episodes: it.episodes,
          year: it.year,
          type: it.type,
        }))
        setResults(items)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [q])

  return (
    <div className="watch-search">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Busca un anime para ver…"
        className="input watch-search-input"
        aria-label="Buscar anime"
      />

      {loading ? <p className="text-sm text-muted mt-3">Buscando…</p> : null}

      {results.length > 0 ? (
        <div className="watch-search-grid mt-4">
          {results.map((r) => (
            <Link key={r.mal_id} href={`/ver/${r.mal_id}/1`} className="watch-search-card">
              {r.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.image} alt="" className="watch-search-thumb" />
              ) : (
                <span className="watch-search-thumb watch-search-thumb-empty" />
              )}
              <div className="min-w-0">
                <p className="watch-search-title">{r.title}</p>
                <p className="watch-search-meta">
                  {[r.type, r.episodes ? `${r.episodes} eps` : null, r.year].filter(Boolean).join(' · ')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}

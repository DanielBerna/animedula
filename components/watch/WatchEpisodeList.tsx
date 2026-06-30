'use client'

import { useEffect, useMemo, useRef } from 'react'

export type EpisodeListItem = {
  number: number
  title: string | null
  filler: boolean
  recap: boolean
  hasLatino: boolean
  mirrorServers: string[]
}

type Props = {
  episodes: EpisodeListItem[]
  current: number
  maxEpisode: number
  totalEpisodes: number | null
  airedEpisodes: number
  isAiring: boolean
  watched: Set<number>
  onSelect: (n: number) => void
}

const RANGE_SIZE = 50

export default function WatchEpisodeList({
  episodes,
  current,
  maxEpisode,
  totalEpisodes,
  airedEpisodes,
  isAiring,
  watched,
  onSelect,
}: Props) {
  const activeRef = useRef<HTMLButtonElement>(null)
  const rangeStart = Math.floor((current - 1) / RANGE_SIZE) * RANGE_SIZE + 1
  const rangeEnd = Math.min(rangeStart + RANGE_SIZE - 1, maxEpisode)

  const ranges = useMemo(() => {
    const out: { start: number; end: number }[] = []
    for (let s = 1; s <= maxEpisode; s += RANGE_SIZE) {
      out.push({ start: s, end: Math.min(s + RANGE_SIZE - 1, maxEpisode) })
    }
    return out
  }, [maxEpisode])

  const visible = useMemo(() => {
    if (episodes.length === 0) {
      return Array.from({ length: rangeEnd - rangeStart + 1 }, (_, i) => ({
        number: rangeStart + i,
        title: null,
        filler: false,
        recap: false,
        hasLatino: false,
        mirrorServers: [] as string[],
      }))
    }
    return episodes.filter((e) => e.number >= rangeStart && e.number <= rangeEnd)
  }, [episodes, rangeStart, rangeEnd])

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [current, rangeStart])

  const countLabel = totalEpisodes
    ? `${totalEpisodes} capítulos`
    : isAiring && airedEpisodes > 0
      ? `${airedEpisodes} emitidos · en emisión`
      : maxEpisode > 1
        ? `${maxEpisode} capítulos`
        : 'Capítulos'

  return (
    <section className="watch-ep-panel" aria-label="Lista de capítulos">
      <div className="watch-ep-panel-head">
        <h3 className="watch-ep-panel-title">{countLabel}</h3>
        <p className="watch-ep-panel-legend text-xs text-faint">
          <span className="watch-ep-legend-dot is-lat" /> latino en BD
          <span className="watch-ep-legend-dot is-watched" /> visto
          <span className="watch-ep-legend-tag">R</span> relleno
        </p>
      </div>

      {ranges.length > 1 ? (
        <div className="watch-ep-ranges" role="tablist" aria-label="Rango de capítulos">
          {ranges.map((r) => {
            const active = current >= r.start && current <= r.end
            return (
              <button
                key={r.start}
                type="button"
                role="tab"
                aria-selected={active}
                className={`watch-ep-range${active ? ' is-active' : ''}`}
                onClick={() => onSelect(r.start)}
              >
                {r.start}–{r.end}
              </button>
            )
          })}
        </div>
      ) : null}

      <ol className="watch-ep-grid" start={rangeStart}>
        {visible.map((ep) => {
          const seen = watched.has(ep.number)
          const isActive = ep.number === current
          const label = ep.title || `Episodio ${ep.number}`
          return (
            <li key={ep.number}>
              <button
                ref={isActive ? activeRef : undefined}
                type="button"
                className={`watch-ep-cell${isActive ? ' is-active' : ''}${seen ? ' is-watched' : ''}${ep.filler ? ' is-filler' : ''}`}
                onClick={() => onSelect(ep.number)}
                title={label}
              >
                <span className="watch-ep-cell-num">{ep.number}</span>
                {ep.hasLatino ? <span className="watch-ep-cell-lat" aria-label="Latino" /> : null}
                {ep.filler ? <span className="watch-ep-cell-tag">R</span> : null}
                {ep.recap ? <span className="watch-ep-cell-tag">Rec</span> : null}
                {seen ? <span className="watch-ep-cell-check" aria-hidden>✓</span> : null}
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

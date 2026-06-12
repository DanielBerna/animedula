'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { NAV } from '../lib/copy'
import {
  formatSeasonYear,
  getCurrentSeasonInfo,
  isSeasonKey,
  listSeasonYears,
  SEASON_ORDER,
  type SeasonKey,
} from '../lib/seasons'
import { SEASON_NAMES } from '../lib/jikan'

type Props = {
  selectedYear?: number
  selectedSeason?: SeasonKey
}

export default function SeasonPicker({ selectedYear, selectedSeason }: Props) {
  const router = useRouter()
  const current = getCurrentSeasonInfo()
  const years = listSeasonYears()
  const year = selectedYear ?? current.year
  const browsing = Boolean(selectedYear && selectedSeason)

  return (
    <div className="season-picker card-glass p-4 md:p-5">
      <div className="season-picker-head">
        <p className="eyebrow text-xs">Explorar</p>
        <h2 className="font-display text-sm font-semibold text-text">{NAV.seasons}</h2>
      </div>

      <div className="season-picker-controls">
        <label className="season-picker-field">
          <span className="season-picker-label">Año</span>
          <select
            className="season-picker-select focus-ring"
            value={year}
            onChange={(e) => {
              const y = Number(e.target.value)
              const s = selectedSeason || current.season
              router.push(`/calendario?year=${y}&season=${s}`)
            }}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>

        {browsing ? (
          <Link href="/calendario" className="season-picker-reset">
            Ver temporada actual
          </Link>
        ) : (
          <span className="season-picker-now tag tag-sec">
            {formatSeasonYear(current.season, current.year)}
          </span>
        )}
      </div>

      <div className="season-picker-seasons" role="group" aria-label="Temporada">
        {SEASON_ORDER.map((s) => {
          const active = browsing && selectedSeason === s && selectedYear === year
          const href = `/calendario?year=${year}&season=${s}`
          return (
            <Link
              key={s}
              href={href}
              className={`season-chip${active ? ' is-active' : ''}`}
              aria-current={active ? 'true' : undefined}
            >
              {SEASON_NAMES[s]}
            </Link>
          )
        })}
      </div>

      {browsing && selectedSeason && selectedYear ? (
        <p className="season-picker-meta text-xs text-muted mt-3">
          Mostrando anime de <strong className="text-text">{formatSeasonYear(selectedSeason, selectedYear)}</strong>
          {!isSeasonKey(selectedSeason) ? null : selectedYear === current.year && selectedSeason === current.season
            ? ' · incluye series en emisión'
            : null}
        </p>
      ) : null}
    </div>
  )
}

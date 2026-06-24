'use client'

import { useEffect, useId, useRef, useState } from 'react'
import {
  defaultListStatus,
  searchShowcaseContent,
  type ShowcaseSection,
  type ShowcaseSearchResult,
} from '../../lib/content-search'

type Selected = {
  title: string
  content_id: string
  image_url: string
}

type Props = {
  section: ShowcaseSection
  value: Selected | null
  onSelect: (item: Selected) => void
  onClear: () => void
  placeholder?: string
}

export default function ContentSearchPicker({
  section,
  value,
  onSelect,
  onClear,
  placeholder,
}: Props) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ShowcaseSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const timer = setTimeout(() => {
      searchShowcaseContent(section, q)
        .then((items) => setResults(items))
        .catch(() => setError('No se pudo buscar'))
        .finally(() => setLoading(false))
    }, 350)

    return () => clearTimeout(timer)
  }, [query, section])

  const labels: Record<ShowcaseSection, string> = {
    anime: 'Buscar anime…',
    manga: 'Buscar manga…',
    game: 'Buscar videojuego…',
  }

  const pick = (item: ShowcaseSearchResult) => {
    onSelect({
      title: item.title,
      content_id: item.id,
      image_url: item.image_url || '',
    })
    setQuery('')
    setResults([])
    setOpen(false)
  }

  if (value?.title) {
    return (
      <div className="content-search-selected">
        <div className="content-search-selected-cover">
          {value.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.image_url} alt="" />
          ) : (
            <span aria-hidden>📀</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text truncate">{value.title}</p>
          <p className="text-[10px] text-faint">ID {value.content_id}</p>
        </div>
        <button type="button" className="btn-ghost text-xs shrink-0" onClick={onClear}>
          Cambiar
        </button>
      </div>
    )
  }

  return (
    <div className="content-search-picker" ref={rootRef}>
      <label htmlFor={listId} className="sr-only">
        {placeholder || labels[section]}
      </label>
      <input
        id={listId}
        type="search"
        className="input w-full text-sm"
        placeholder={placeholder || labels[section]}
        value={query}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
      />
      {open && (query.trim().length >= 2 || loading) ? (
        <div className="content-search-dropdown" role="listbox">
          {loading ? <p className="content-search-hint">Buscando…</p> : null}
          {error ? <p className="content-search-hint text-red-400">{error}</p> : null}
          {!loading && !error && results.length === 0 && query.trim().length >= 2 ? (
            <p className="content-search-hint">Sin resultados. Prueba otro título.</p>
          ) : null}
          <ul className="content-search-results">
            {results.map((item) => (
              <li key={item.id}>
                <button type="button" className="content-search-option" onClick={() => pick(item)}>
                  <span className="content-search-option-cover">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt="" />
                    ) : (
                      <span aria-hidden>?</span>
                    )}
                  </span>
                  <span className="content-search-option-title">{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {query.trim().length > 0 && query.trim().length < 2 ? (
        <p className="text-[10px] text-faint mt-1">Escribe al menos 2 letras</p>
      ) : null}
    </div>
  )
}

export { defaultListStatus }

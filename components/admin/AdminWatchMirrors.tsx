'use client'

import { useCallback, useEffect, useState } from 'react'
import { useToast } from '../ToastProvider'
import type { WatchEpisodeSourceRow, WatchLang, WatchMediaRow } from '../../lib/watch/types'
import type { WatchCatalogGap, WatchSubmission } from '../../lib/watch/pipeline'

const LANG_OPTIONS: { value: WatchLang; label: string }[] = [
  { value: 'lat', label: 'Latino' },
  { value: 'sub', label: 'Sub' },
  { value: 'dub', label: 'Dub EN' },
]

const TYPE_OPTIONS = [
  { value: 'hls', label: 'HLS (.m3u8)' },
  { value: 'mp4', label: 'MP4 directo' },
  { value: 'iframe', label: 'Iframe embed' },
] as const

export default function AdminWatchMirrors() {
  const { showToast } = useToast()
  const [media, setMedia] = useState<WatchMediaRow[]>([])
  const [sources, setSources] = useState<WatchEpisodeSourceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [gaps, setGaps] = useState<WatchCatalogGap[]>([])
  const [pending, setPending] = useState<WatchSubmission[]>([])

  const [mediaForm, setMediaForm] = useState({
    id: '' as string | number,
    mal_id: '',
    anilist_id: '',
    title: '',
    notes: '',
  })

  const [sourceForm, setSourceForm] = useState({
    media_id: '' as string | number,
    episode: '1',
    lang: 'lat' as WatchLang,
    source_type: 'hls' as WatchEpisodeSourceRow['source_type'],
    server_label: 'Mega',
    url: '',
    referer: '',
    quality: 'Auto',
    sort_order: '0',
  })

  const loadMedia = useCallback(async () => {
    const res = await fetch('/api/admin/watch-mirrors')
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al cargar')
    setMedia(data.media || [])
  }, [])

  const loadSources = useCallback(async (mediaId: number, episode: number) => {
    const res = await fetch(`/api/admin/watch-mirrors?mediaId=${mediaId}&episode=${episode}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al cargar fuentes')
    setSources(data.sources || [])
  }, [])

  const loadGaps = useCallback(async () => {
    const res = await fetch('/api/admin/watch-mirrors?gaps=true')
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al cargar cola')
    setGaps(data.gaps || [])
  }, [])

  const loadPending = useCallback(async () => {
    const res = await fetch('/api/admin/watch-mirrors?pending=true')
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al cargar aportes')
    setPending(data.submissions || [])
  }, [])

  useEffect(() => {
    Promise.all([loadMedia(), loadGaps(), loadPending()])
      .catch(() => showToast({ title: 'Error', description: 'No se pudo cargar la lista' }))
      .finally(() => setLoading(false))
  }, [loadMedia, loadGaps, loadPending, showToast])

  useEffect(() => {
    const mid = Number(sourceForm.media_id)
    const ep = Number(sourceForm.episode) || 1
    if (!mid) return
    loadSources(mid, ep).catch(() => setSources([]))
  }, [sourceForm.media_id, sourceForm.episode, loadSources])

  const saveMedia = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/watch-mirrors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert_media',
          id: mediaForm.id ? Number(mediaForm.id) : undefined,
          mal_id: mediaForm.mal_id ? Number(mediaForm.mal_id) : null,
          anilist_id: mediaForm.anilist_id ? Number(mediaForm.anilist_id) : null,
          title: mediaForm.title,
          notes: mediaForm.notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast({ title: 'Guardado', description: 'Anime registrado para espejos' })
      if (data.media?.id) setSourceForm((f) => ({ ...f, media_id: data.media.id }))
      await loadMedia()
    } catch (err: unknown) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo guardar',
      })
    } finally {
      setSaving(false)
    }
  }

  const saveSource = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/watch-mirrors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert_source',
          media_id: Number(sourceForm.media_id),
          episode: Number(sourceForm.episode) || 1,
          lang: sourceForm.lang,
          source_type: sourceForm.source_type,
          server_label: sourceForm.server_label,
          url: sourceForm.url,
          referer: sourceForm.referer || null,
          quality: sourceForm.quality || null,
          sort_order: Number(sourceForm.sort_order) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast({ title: 'Guardado', description: 'Espejo del capítulo añadido' })
      setSourceForm((f) => ({ ...f, url: '', referer: '' }))
      await loadSources(Number(sourceForm.media_id), Number(sourceForm.episode) || 1)
    } catch (err: unknown) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo guardar',
      })
    } finally {
      setSaving(false)
    }
  }

  const removeSource = async (id: number) => {
    if (!confirm('¿Eliminar este espejo?')) return
    const res = await fetch('/api/admin/watch-mirrors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_source', id }),
    })
    const data = await res.json()
    if (!res.ok) {
      showToast({ title: 'Error', description: data.error })
      return
    }
    await loadSources(Number(sourceForm.media_id), Number(sourceForm.episode) || 1)
  }

  const pickMedia = (row: WatchMediaRow) => {
    setMediaForm({
      id: row.id,
      mal_id: row.mal_id != null ? String(row.mal_id) : '',
      anilist_id: row.anilist_id != null ? String(row.anilist_id) : '',
      title: row.title,
      notes: row.notes || '',
    })
    setSourceForm((f) => ({ ...f, media_id: row.id }))
  }

  const runSeedCatalog = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/watch-mirrors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed_catalog' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al sembrar catálogo')
      showToast({
        title: 'Catálogo actualizado',
        description: `${data.synced} anime de Jikan · ${data.candidates} candidatos`,
      })
      await Promise.all([loadMedia(), loadGaps()])
    } catch (err: unknown) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo sembrar',
      })
    } finally {
      setSaving(false)
    }
  }

  const reviewSubmission = async (id: number, decision: 'approve' | 'reject') => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/watch-mirrors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'review_submission', id, decision }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast({
        title: decision === 'approve' ? 'Aprobado' : 'Rechazado',
        description: 'Aporte procesado',
      })
      await Promise.all([loadPending(), loadGaps(), loadMedia()])
    } catch (err: unknown) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo revisar',
      })
    } finally {
      setSaving(false)
    }
  }

  const runImport = async () => {
    setSaving(true)
    try {
      const payload = JSON.parse(importJson)
      const res = await fetch('/api/admin/watch-mirrors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import_batch', payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Importación fallida')
      showToast({
        title: 'Importación lista',
        description: `${data.sourcesAdded} espejos · ${data.sourcesSkipped} omitidos · ${data.showsRegistered} anime`,
      })
      if (data.errors?.length) {
        console.warn('[import espejos]', data.errors)
      }
      await Promise.all([loadMedia(), loadGaps(), loadPending()])
    } catch (err: unknown) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'JSON inválido o error de red',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page space-y-8">
      <header>
        <p className="eyebrow mb-1">Ver anime</p>
        <h1 className="page-title">Espejos por episodio</h1>
        <p className="text-sm text-muted mt-2 max-w-2xl">
          Aquí se configura el doblaje latino y servidores propios (HLS, MP4, iframe). Los agregadores
          externos solo sirven de respaldo.
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-glass p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-semibold text-text">Cola sin latino</h2>
            <span className="tag tag-accent">{gaps.length}</span>
          </div>
          <p className="text-sm text-muted">
            Anime ya registrados en la BD pero sin ningún espejo latino. Prioridad: top → temporada →
            emisión.
          </p>
          <button type="button" className="btn-ghost text-xs" disabled={saving} onClick={runSeedCatalog}>
            {saving ? 'Sembrando…' : '↻ Traer top + temporada + emisión (Jikan)'}
          </button>
          {gaps.length === 0 ? (
            <p className="text-sm text-muted">Nada pendiente o ejecuta el sembrado arriba.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {gaps.slice(0, 20).map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    className="w-full text-left card-glass p-3 hover:border-accent/40"
                    onClick={() => pickMedia(g)}
                  >
                    <p className="text-sm font-semibold text-text">{g.title}</p>
                    <p className="text-xs text-muted">
                      MAL {g.mal_id} · {g.catalog_source || 'manual'} · prio {g.priority}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-glass p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-semibold text-text">Aportes pendientes</h2>
            <span className="tag tag-accent">{pending.length}</span>
          </div>
          {pending.length === 0 ? (
            <p className="text-sm text-muted">Sin aportes de usuarios por revisar.</p>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {pending.map((s) => (
                <li key={s.id} className="card-glass p-3 space-y-2">
                  <p className="text-sm font-semibold text-text">
                    MAL {s.mal_id} · ep {s.episode} · {s.lang}
                  </p>
                  <p className="text-xs text-muted font-mono truncate">{s.url}</p>
                  {s.submitter_name ? (
                    <p className="text-xs text-faint">por {s.submitter_name}</p>
                  ) : null}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-primary text-xs"
                      disabled={saving}
                      onClick={() => reviewSubmission(s.id, 'approve')}
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      disabled={saving}
                      onClick={() => reviewSubmission(s.id, 'reject')}
                    >
                      Rechazar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card-glass p-6 space-y-4">
          <h2 className="font-display font-semibold text-text">Registrar anime</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eyebrow block mb-1">MAL id</label>
              <input
                className="input w-full text-sm"
                value={mediaForm.mal_id}
                onChange={(e) => setMediaForm((f) => ({ ...f, mal_id: e.target.value }))}
                placeholder="21"
              />
            </div>
            <div>
              <label className="eyebrow block mb-1">AniList id (respaldo)</label>
              <input
                className="input w-full text-sm"
                value={mediaForm.anilist_id}
                onChange={(e) => setMediaForm((f) => ({ ...f, anilist_id: e.target.value }))}
                placeholder="1535"
              />
            </div>
          </div>
          <div>
            <label className="eyebrow block mb-1">Título</label>
            <input
              className="input w-full text-sm"
              value={mediaForm.title}
              onChange={(e) => setMediaForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="eyebrow block mb-1">Notas internas</label>
            <textarea
              className="input w-full text-sm"
              rows={2}
              value={mediaForm.notes}
              onChange={(e) => setMediaForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <button type="button" className="btn-primary text-xs" disabled={saving} onClick={saveMedia}>
            {saving ? 'Guardando…' : 'Guardar anime'}
          </button>
        </div>

        <div className="card-glass p-6 space-y-4">
          <h2 className="font-display font-semibold text-text">Espejo de capítulo</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eyebrow block mb-1">Media id</label>
              <input
                className="input w-full text-sm"
                value={sourceForm.media_id}
                onChange={(e) => setSourceForm((f) => ({ ...f, media_id: e.target.value }))}
              />
            </div>
            <div>
              <label className="eyebrow block mb-1">Capítulo</label>
              <input
                type="number"
                min={1}
                className="input w-full text-sm"
                value={sourceForm.episode}
                onChange={(e) => setSourceForm((f) => ({ ...f, episode: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="eyebrow block mb-1">Idioma</label>
              <select
                className="input w-full text-sm"
                value={sourceForm.lang}
                onChange={(e) => setSourceForm((f) => ({ ...f, lang: e.target.value as WatchLang }))}
              >
                {LANG_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="eyebrow block mb-1">Tipo</label>
              <select
                className="input w-full text-sm"
                value={sourceForm.source_type}
                onChange={(e) =>
                  setSourceForm((f) => ({
                    ...f,
                    source_type: e.target.value as WatchEpisodeSourceRow['source_type'],
                  }))
                }
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="eyebrow block mb-1">Orden</label>
              <input
                type="number"
                className="input w-full text-sm"
                value={sourceForm.sort_order}
                onChange={(e) => setSourceForm((f) => ({ ...f, sort_order: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="eyebrow block mb-1">Etiqueta servidor</label>
            <input
              className="input w-full text-sm"
              value={sourceForm.server_label}
              onChange={(e) => setSourceForm((f) => ({ ...f, server_label: e.target.value }))}
              placeholder="Mega, MP4Upload, Fembed…"
            />
          </div>
          <div>
            <label className="eyebrow block mb-1">URL</label>
            <input
              className="input w-full text-sm font-mono"
              value={sourceForm.url}
              onChange={(e) => setSourceForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://…/master.m3u8"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eyebrow block mb-1">Referer (HLS)</label>
              <input
                className="input w-full text-sm font-mono"
                value={sourceForm.referer}
                onChange={(e) => setSourceForm((f) => ({ ...f, referer: e.target.value }))}
              />
            </div>
            <div>
              <label className="eyebrow block mb-1">Calidad</label>
              <input
                className="input w-full text-sm"
                value={sourceForm.quality}
                onChange={(e) => setSourceForm((f) => ({ ...f, quality: e.target.value }))}
              />
            </div>
          </div>
          <button type="button" className="btn-primary text-xs" disabled={saving} onClick={saveSource}>
            {saving ? 'Guardando…' : 'Añadir espejo'}
          </button>
        </div>
      </section>

      <section className="card-glass p-6 space-y-4">
        <h2 className="font-display font-semibold text-text">Importación masiva (JSON)</h2>
        <p className="text-sm text-muted">
          Pega un JSON con muchos capítulos de golpe. Resuelve título y AniList desde MAL automáticamente.
          Omite URLs duplicadas. Formato de ejemplo en{' '}
          <code className="text-xs">scripts/watch-import.example.json</code>.
        </p>
        <textarea
          className="input w-full text-xs font-mono min-h-[160px]"
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          placeholder='{"shows":[{"mal_id":21,"episodes":[{"episode":1,"sources":[{"lang":"lat","source_type":"iframe","server_label":"Mega","url":"https://..."}]}]}]}'
        />
        <button type="button" className="btn-primary text-xs" disabled={saving || !importJson.trim()} onClick={runImport}>
          {saving ? 'Importando…' : 'Importar JSON'}
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-text">Anime registrados</h2>
        {loading ? (
          <p className="text-sm text-muted">Cargando…</p>
        ) : media.length === 0 ? (
          <p className="text-sm text-muted">Aún no hay anime con espejos. Registra el primero arriba.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {media.map((row) => (
              <button
                key={row.id}
                type="button"
                className="card-glass p-4 text-left hover:border-accent/40 transition"
                onClick={() => pickMedia(row)}
              >
                <p className="font-semibold text-sm text-text">{row.title}</p>
                <p className="text-xs text-muted mt-1">
                  MAL {row.mal_id ?? '—'} · AniList {row.anilist_id ?? '—'} · id {row.id}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      {sourceForm.media_id ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-text">
            Espejos · cap. {sourceForm.episode}
          </h2>
          {sources.length === 0 ? (
            <p className="text-sm text-muted">Sin espejos para este capítulo.</p>
          ) : (
            <ul className="space-y-2">
              {sources.map((s) => (
                <li key={s.id} className="card-glass p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text">
                      {s.server_label} · {s.lang} · {s.source_type}
                    </p>
                    <p className="text-xs text-muted font-mono truncate">{s.url}</p>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost text-xs shrink-0"
                    onClick={() => removeSource(s.id)}
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  )
}

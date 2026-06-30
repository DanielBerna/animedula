'use client'

import { useMemo, useState } from 'react'
import { buildEmbedUrl, type EmbedType } from '../../lib/watch/embed'

type Props = {
  malId: number
  title: string
  episodeCount?: number | null
}

export default function AnimePlayer({ malId, title, episodeCount }: Props) {
  const total = episodeCount && episodeCount > 0 ? episodeCount : 0
  const [episode, setEpisode] = useState(1)
  const [type, setType] = useState<EmbedType>('sub')

  const src = useMemo(() => buildEmbedUrl(malId, episode, type), [malId, episode, type])

  // Si no conocemos el total, ofrecemos un bloque genérico de 12 + entrada manual.
  const buttons = total > 0 ? total : 12

  return (
    <div className="watch-player">
      <div className="watch-frame-wrap">
        <iframe
          key={src}
          src={src}
          title={`${title} · Episodio ${episode}`}
          allowFullScreen
          referrerPolicy="origin"
          sandbox="allow-same-origin allow-scripts allow-presentation allow-forms"
          className="watch-frame"
        />
      </div>

      <div className="watch-controls">
        <div className="watch-type-toggle" role="group" aria-label="Idioma">
          <button
            type="button"
            className={`watch-type-btn${type === 'sub' ? ' is-active' : ''}`}
            onClick={() => setType('sub')}
          >
            Sub
          </button>
          <button
            type="button"
            className={`watch-type-btn${type === 'dub' ? ' is-active' : ''}`}
            onClick={() => setType('dub')}
          >
            Dub
          </button>
        </div>

        <label className="watch-jump">
          Ir al episodio
          <input
            type="number"
            min={1}
            value={episode}
            onChange={(e) => setEpisode(Math.max(1, Number(e.target.value) || 1))}
            className="input watch-jump-input"
          />
        </label>
      </div>

      <div className="watch-episodes">
        {Array.from({ length: buttons }, (_, i) => i + 1).map((n) => (
          <button
            type="button"
            key={n}
            className={`watch-ep${n === episode ? ' is-active' : ''}`}
            onClick={() => setEpisode(n)}
          >
            {n}
          </button>
        ))}
      </div>

      <p className="text-xs text-faint mt-3">
        El video proviene de servidores externos de terceros. Animédula no aloja ni administra estos
        contenidos; solo se muestran mediante reproductor incrustado. Si un episodio no carga, prueba
        cambiar de Sub/Dub o vuelve más tarde.
      </p>
    </div>
  )
}

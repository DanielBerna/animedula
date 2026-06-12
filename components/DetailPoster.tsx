import { ReactNode } from 'react'
import IconOrb from './icons/IconOrb'
import PosterImage from './PosterImage'
import { getBestImageUrl, JikanImages } from '../lib/jikan'

type Props = {
  title: string
  image?: string | null
  images?: JikanImages | null
  kind: 'anime' | 'manga'
  badges?: ReactNode
  footer?: ReactNode
}

export default function DetailPoster({ title, image, images, kind, badges, footer }: Props) {
  const src = image || getBestImageUrl(images)
  const ratio = kind === 'manga' ? 'aspect-[3/4]' : 'aspect-[2/3]'

  return (
    <div className="card-glass p-5 md:p-6">
      <div className={`relative rounded-xl overflow-hidden border border-white/8 shadow-card mb-5 ${ratio}`}>
        {src ? (
          <PosterImage src={src} alt={title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 320px" priority />
        ) : (
          <div className={`w-full h-full bg-surface-4 flex items-center justify-center ${ratio}`}>
            <IconOrb name={kind === 'manga' ? 'manga' : 'anime'} variant={kind === 'manga' ? 'manga' : 'anime'} size="lg" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface/70 via-transparent to-transparent pointer-events-none" />
      </div>

      <p className="eyebrow mb-2">{kind === 'manga' ? 'Manga' : 'Anime'}</p>
      <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight leading-tight text-text">{title}</h1>
      {badges && <div className="mt-3 flex flex-wrap gap-2">{badges}</div>}
      {footer}
    </div>
  )
}

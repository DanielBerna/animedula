import { ReactNode } from 'react'

type Props = {
  title: string
  image?: string | null
  kind: 'anime' | 'manga'
  badges?: ReactNode
  footer?: ReactNode
}

export default function DetailPoster({ title, image, kind, badges, footer }: Props) {
  return (
    <div className="card-glass p-5 md:p-6">
      <div className="relative rounded-xl overflow-hidden border border-white/8 shadow-card mb-5">
        {image ? (
          <img
            src={image}
            alt={title}
            className={`w-full object-cover ${kind === 'manga' ? 'aspect-[3/4]' : 'aspect-[2/3]'}`}
          />
        ) : (
          <div className={`w-full bg-surface-4 flex items-center justify-center text-5xl ${kind === 'manga' ? 'aspect-[3/4]' : 'aspect-[2/3]'}`}>
            {kind === 'manga' ? '📖' : '🎌'}
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

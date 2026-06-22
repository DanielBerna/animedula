import Link from 'next/link'
import { notFound } from 'next/navigation'
import NewsSourceCredit from '../../../../components/NewsSourceCredit'
import { DETAIL_COPY, NEWS_COPY } from '../../../../lib/copy'
import { NEWS_CATEGORY_LABELS, NEWS_CATEGORY_CLASS } from '../../../../lib/news/search'
import { fetchNewsBySlug, isNewsCategory } from '../../../../lib/rss'

export const revalidate = 7200

type Props = {
  params: Promise<{ categoria: string; id: string }>
}

const CATEGORY_BACK = {
  gaming: '/videojuegos',
  tech: '/tecnologia',
  collect: '/coleccionables',
} as const

function formatDate(value?: string) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function NoticiaDetailPage({ params }: Props) {
  const { categoria, id } = await params
  if (!isNewsCategory(categoria)) notFound()

  const item = await fetchNewsBySlug(categoria, id)
  if (!item) notFound()

  const date = formatDate(item.publishedAt)

  return (
    <div className="space-y-8 enter-up max-w-3xl mx-auto">
      <Link href="/noticias" className="section-link text-sm">
        ← {DETAIL_COPY.backToNews}
      </Link>

      {item.imageUrl ? (
        <div className={`news-detail-hero ${NEWS_CATEGORY_CLASS[categoria]}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.imageUrl} alt="" className="news-detail-hero-img" />
          <div className="news-detail-hero-overlay" />
        </div>
      ) : null}

      <article className="card-glass p-6 md:p-8 space-y-5">
        <header className="space-y-3">
          <p className="eyebrow">{NEWS_COPY.eyebrow}</p>
          <h1 className="page-title">{item.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
            <span className={`tag tag-sec ${NEWS_CATEGORY_CLASS[categoria]}`}>
              {NEWS_CATEGORY_LABELS[categoria]}
            </span>
            <span className="tag tag-sec">{item.source}</span>
            {date ? <time dateTime={item.publishedAt}>{date}</time> : null}
          </div>
        </header>

        {item.summary ? (
          <div className="prose-news">
            <p className="text-base text-text leading-relaxed">{item.summary}</p>
          </div>
        ) : null}

        <NewsSourceCredit sourceName={item.source} articleUrl={item.link} />

        <div className="pt-2 flex flex-wrap gap-3">
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
          >
            {DETAIL_COPY.readOriginal}
          </a>
          <Link href={CATEGORY_BACK[categoria]} className="btn-ghost">
            {DETAIL_COPY.moreNews}
          </Link>
        </div>

        <p className="text-xs text-faint">{DETAIL_COPY.translationNote}</p>
      </article>
    </div>
  )
}

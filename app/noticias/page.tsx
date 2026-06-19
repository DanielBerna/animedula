import PageHeader from '../../components/PageHeader'
import NewsHub from '../../components/NewsHub'
import { NEWS_COPY } from '../../lib/copy'
import { fetchAllNews } from '../../lib/news/home-feed'
import { fetchNews, type NewsCategory } from '../../lib/rss'

export const revalidate = 3600

const SECTIONS: { category: NewsCategory; title: string; href: string }[] = [
  { category: 'collect', title: 'Anime y coleccionables', href: '/coleccionables' },
  { category: 'gaming', title: 'Videojuegos', href: '/videojuegos' },
  { category: 'tech', title: 'Tecnología', href: '/tecnologia' },
]

export default async function NoticiasPage() {
  const [headlines, ...sectionItems] = await Promise.all([
    fetchAllNews(16),
    ...SECTIONS.map((s) => fetchNews(s.category, 6)),
  ])

  const sections = SECTIONS.map((section, i) => ({
    ...section,
    items: sectionItems[i] || [],
  }))

  return (
    <div className="space-y-10 enter-up">
      <PageHeader
        variant="default"
        eyebrow={NEWS_COPY.eyebrow}
        title="Noticias otaku"
        description="Lo último en anime, gaming y tecnología. Fuentes en español latino."
      />

      {headlines.length > 0 ? (
        <NewsHub headlines={headlines} sections={sections} />
      ) : (
        <p className="text-sm text-muted card-glass p-5">{NEWS_COPY.empty}</p>
      )}
    </div>
  )
}

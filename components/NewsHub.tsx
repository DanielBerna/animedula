'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { NewsCategory, NewsItem } from '../lib/rss'
import {
  filterNewsItems,
  NEWS_CATEGORY_CLASS,
  NEWS_CATEGORY_LABELS,
  type NewsFilterCategory,
} from '../lib/news/search'
import { NEWS_COPY } from '../lib/copy'
import NewsCard from './NewsCard'

type Section = {
  category: NewsCategory
  title: string
  href: string
  items: NewsItem[]
}

type Props = {
  headlines: NewsItem[]
  sections: Section[]
}

const FILTERS: { value: NewsFilterCategory; label: string }[] = [
  { value: 'all', label: NEWS_COPY.filterAll },
  { value: 'collect', label: NEWS_CATEGORY_LABELS.collect },
  { value: 'gaming', label: NEWS_CATEGORY_LABELS.gaming },
  { value: 'tech', label: NEWS_CATEGORY_LABELS.tech },
]

export default function NewsHub({ headlines, sections }: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<NewsFilterCategory>('all')

  const allItems = useMemo(() => {
    const map = new Map<string, NewsItem>()
    for (const item of headlines) map.set(item.id, item)
    for (const section of sections) {
      for (const item of section.items) map.set(item.id, item)
    }
    return Array.from(map.values())
  }, [headlines, sections])

  const filtered = useMemo(
    () => filterNewsItems(allItems, query, category),
    [allItems, query, category],
  )

  const searching = query.trim().length > 0 || category !== 'all'
  const featured = searching ? filtered.slice(0, 1) : headlines.slice(0, 1)
  const gridItems = searching ? filtered : headlines.slice(1)

  return (
    <div className="space-y-10">
      <div className="news-search-bar card-glass">
        <label htmlFor="news-search" className="sr-only">
          {NEWS_COPY.searchPlaceholder}
        </label>
        <div className="news-search-input-wrap">
          <span className="news-search-icon" aria-hidden>
            ⌕
          </span>
          <input
            id="news-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={NEWS_COPY.searchPlaceholder}
            className="news-search-input"
            autoComplete="off"
          />
        </div>
        <div className="news-filter-pills" role="group" aria-label={NEWS_COPY.filterLabel}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`news-filter-pill ${category === f.value ? 'is-active' : ''}`}
              onClick={() => setCategory(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {searching && filtered.length === 0 ? (
        <p className="text-sm text-muted card-glass p-5">{NEWS_COPY.searchEmpty}</p>
      ) : null}

      {!searching && featured.length > 0 ? (
        <section>
          <div className="section-head">
            <h2 className="font-display text-xl font-bold text-text">{NEWS_COPY.featuredTitle}</h2>
          </div>
          <div className="news-featured-layout">
            {featured.map((item) => (
              <NewsCard key={item.id} item={item} variant="hero" />
            ))}
            {headlines.slice(1, 3).map((item) => (
              <NewsCard key={item.id} item={item} variant="side" />
            ))}
          </div>
        </section>
      ) : null}

      {(searching ? filtered.length > 0 : gridItems.length > 0) ? (
        <section>
          <div className="section-head">
            <h2 className="font-display text-xl font-bold text-text">
              {searching ? NEWS_COPY.searchResults(filtered.length) : NEWS_COPY.latestTitle}
            </h2>
          </div>
          <div className="news-grid">
            {(searching ? filtered : gridItems).map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      {!searching
        ? sections.map((section) => (
            <section key={section.category}>
              <div className="section-head">
                <div>
                  <p className="eyebrow mb-1">{NEWS_COPY.eyebrow}</p>
                  <h2 className="font-display text-xl font-bold text-text">{section.title}</h2>
                </div>
              </div>
              <div className="news-grid news-grid-compact">
                {section.items.map((item) => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </div>
              <Link href={section.href} className="section-link text-sm mt-3 inline-block">
                {NEWS_COPY.goToSection(section.title.toLowerCase())}
              </Link>
            </section>
          ))
        : null}
    </div>
  )
}

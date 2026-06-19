export type ContentType = 'anime' | 'manga' | 'game' | 'movie'

export type MetricDef = {
  key: string
  label: string
}

const ANIME_METRICS: MetricDef[] = [
  { key: 'animation', label: 'Animación / Dirección' },
  { key: 'soundtrack', label: 'Banda sonora' },
  { key: 'script', label: 'Guion' },
  { key: 'pacing', label: 'Ritmo' },
]

const MANGA_METRICS: MetricDef[] = [
  { key: 'art', label: 'Arte' },
  { key: 'story', label: 'Historia' },
  { key: 'characters', label: 'Personajes' },
  { key: 'pacing', label: 'Ritmo' },
]

const GAME_METRICS: MetricDef[] = [
  { key: 'graphics', label: 'Gráficos' },
  { key: 'gameplay', label: 'Jugabilidad' },
  { key: 'story', label: 'Historia' },
  { key: 'optimization', label: 'Optimización' },
]

export function getReviewMetrics(contentType: ContentType): MetricDef[] {
  switch (contentType) {
    case 'manga':
      return MANGA_METRICS
    case 'game':
      return GAME_METRICS
    case 'movie':
      return ANIME_METRICS
    default:
      return ANIME_METRICS
  }
}

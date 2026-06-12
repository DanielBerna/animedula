export type MediaKind = 'anime' | 'manga'

export type EditorialReview = {
  gancho: string
  por_que: string
  para_quien: string
  no_para: string
  contexto_mx: string
  veredicto: 'Recomendado' | 'Con reservas' | 'Solo para fans del género'
  firma: 'Animédula'
}

export type ReviewInput = {
  kind: MediaKind
  id: string | number
  title: string
  synopsis?: string
  score?: number | null
  genres?: string[]
  status?: string
  chapters?: number | null
}

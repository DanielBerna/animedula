import { EditorialReview, ReviewInput } from './types'

export function buildFallbackReview(input: ReviewInput): EditorialReview {
  const { title, kind, score, genres = [] } = input
  const g = genres[0] || (kind === 'manga' ? 'seinen' : 'shōnen')
  const high = typeof score === 'number' && score >= 8
  const mid = typeof score === 'number' && score >= 7 && score < 8

  const veredicto: EditorialReview['veredicto'] = high
    ? 'Recomendado'
    : mid
      ? 'Con reservas'
      : 'Solo para fans del género'

  const gancho =
    kind === 'manga'
      ? `${title} pide tiempo, pero ${high ? 'compensa' : 'no es para leer a medias'}.`
      : `${title} destaca si buscas ${g} con personalidad, no solo ruido de temporada.`

  const por_que = high
    ? `Funciona porque el género (${g}) y la ejecución se sostienen más allá del primer arco. No lo subimos por el número de MAL, sino porque deja marca.`
    : `Tiene tramos fuertes para fans de ${g}, aunque no es la puerta de entrada más fácil del año.`

  const para_quien =
    kind === 'manga'
      ? `Quien lee ${g} con calma y no le molesta un ritmo exigente.`
      : `Fans de ${g} que quieren un maratón con sentido, no solo ruido de fondo.`

  const no_para = high
    ? `Si buscas algo ligero o sin compromiso emocional.`
    : `Si esperas la entrada más accesible del género.`

  const contexto_mx =
    kind === 'manga'
      ? `Busca tomos en Amazon o Mercado Libre, o apps legales si están disponibles. Ideal para leer de noche o en el transporte.`
      : `Arma un maratón de fin de semana y revisa en qué app está antes de pagar una suscripción nueva.`

  return {
    gancho,
    por_que,
    para_quien,
    no_para,
    contexto_mx,
    veredicto,
    firma: 'Animédula',
  }
}

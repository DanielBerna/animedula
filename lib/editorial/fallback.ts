import { EditorialReview, ReviewInput } from './types'

export function buildFallbackReview(input: ReviewInput): EditorialReview {
  const { title, kind, score, genres = [] } = input
  const g = genres[0] || (kind === 'manga' ? 'seinen/shōnen' : 'shōnen')
  const high = typeof score === 'number' && score >= 8
  const mid = typeof score === 'number' && score >= 7 && score < 8

  const veredicto: EditorialReview['veredicto'] = high
    ? 'Recomendado'
    : mid
      ? 'Con reservas'
      : 'Solo para fans del género'

  const gancho =
    kind === 'manga'
      ? `${title} no es solo leer — es invertir tiempo en un mundo que ${high ? 'recompensa' : 'exige'} paciencia.`
      : `${title} entra en conversación cuando buscas ${g} con personalidad propia, no solo hype de temporada.`

  const por_que = high
    ? `Animédula lo sube porque combina identidad de género (${g}) con ejecución que se sostiene más allá del primer arco. No lo recomendamos por el score de MAL, sino porque deja huella si te gusta ese tipo de narrativa.`
    : `Lo incluimos con criterio: tiene momentos fuertes para fans de ${g}, aunque no es la puerta de entrada perfecta si vienes de blockbusters más accesibles.`

  const para_quien =
    kind === 'manga'
      ? `Lectores que disfrutan ${g} y no les asusta un ritmo que pide constancia.`
      : `Fans de ${g} que prefieren maratón con propósito, no solo episodio de fondo.`

  const no_para = high
    ? `Quien busque algo ultraligero o sin compromiso emocional.`
    : `Quien espere el anime/manga más fácil del año sin curva de entrada.`

  const contexto_mx =
    kind === 'manga'
      ? `En México conviene combinar tomo físico (Amazon/ML) o app legal si está disponible — ideal para lectura nocturna o viajes del metro.`
      : `Para México: planea maratón nocturna o fin de semana; verifica streaming antes de suscribirte a una plataforma nueva.`

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

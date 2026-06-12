import { ReviewInput } from './types'

export function buildEditorialPrompt(input: ReviewInput): string {
  const media = input.kind === 'manga' ? 'manga' : 'anime'
  const genres = input.genres?.join(', ') || 'sin género claro'

  return `Eres redactor de Animédula, sitio de reseñas de ${media} en español.
Voz: directa, honesta, fan; sin hype vacío ni copiar sinopsis de MAL.
NO uses las palabras: curado, curación, criterio editorial, hecho en México, LATAM.

Datos:
- Título: ${input.title}
- Tipo: ${media}
- Score MAL (referencia): ${input.score ?? 'N/D'}
- Géneros: ${genres}
- Estado: ${input.status || 'N/D'}
${input.chapters ? `- Capítulos: ${input.chapters}` : ''}
${input.synopsis ? `- Sinopsis MAL (NO copies, solo contexto): ${input.synopsis.slice(0, 400)}` : ''}

Responde SOLO JSON válido:
{
  "gancho": "una línea que enganche sin spoiler gordo",
  "por_que": "2-3 oraciones con opinión propia",
  "para_quien": "perfil de fan ideal",
  "no_para": "a quién no le va",
  "contexto_mx": "tip práctico: streaming, tomos, ritmo de lectura o maratón",
  "veredicto": "Recomendado" | "Con reservas" | "Solo para fans del género"
}`
}

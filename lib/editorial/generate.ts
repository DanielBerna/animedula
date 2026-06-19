import { buildEditorialPrompt } from './prompt'
import { buildFallbackReview } from './fallback'
import { EditorialReview, ReviewInput } from './types'

function parseReview(raw: string): EditorialReview | null {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    const parsed = JSON.parse(jsonMatch[0])
    if (!parsed.gancho || !parsed.por_que || !parsed.veredicto) return null
    return {
      gancho: String(parsed.gancho),
      por_que: String(parsed.por_que),
      para_quien: String(parsed.para_quien || ''),
      no_para: String(parsed.no_para || ''),
      contexto_mx: String(parsed.contexto_mx || ''),
      veredicto: parsed.veredicto as EditorialReview['veredicto'],
      firma: 'Animédula',
    }
  } catch {
    return null
  }
}

export async function generateEditorialReview(input: ReviewInput): Promise<EditorialReview> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return buildFallbackReview(input)

  try {
    const { default: Replicate } = await import('replicate')
    const replicate = new Replicate({ auth: token })
    const model = process.env.REPLICATE_MODEL || 'meta/meta-llama-3-8b-instruct'
    const prompt = buildEditorialPrompt(input)

    const output = await replicate.run(model as `${string}/${string}`, {
      input: {
        prompt,
        max_tokens: 1100,
        temperature: 0.82,
      },
    })

    const text = Array.isArray(output) ? output.join('') : String(output)
    const parsed = parseReview(text)
    return parsed || buildFallbackReview(input)
  } catch {
    return buildFallbackReview(input)
  }
}

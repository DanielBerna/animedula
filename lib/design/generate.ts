/**
 * Generación de assets gráficos (stickers, marcos, insignias) con IA vía Replicate.
 * Opt-in: si no hay REPLICATE_API_TOKEN, no hace nada y el admin sigue funcionando
 * con subida manual (costo $0).
 *
 * Modelos (configurables por env):
 *  - texto → imagen:  REPLICATE_IMAGE_MODEL   (default flux-schnell, ~$0.003/img)
 *  - boceto → imagen: REPLICATE_IMG2IMG_MODEL (default flux-dev, image-to-image)
 */

export type RewardType = 'sticker' | 'border' | 'badge'

export type GenerateResult =
  | { ok: true; buffer: Buffer; mime: string }
  | { ok: false; error: string }

// Pistas de estilo añadidas al prompt según el tipo de premio.
const TYPE_HINTS: Record<RewardType, string> = {
  sticker:
    'die-cut chibi anime sticker, bold clean outline, flat vibrant colors, centered single subject, plain solid white background, high contrast, no text, no watermark',
  badge:
    'circular game achievement emblem badge, ornate metallic, centered, plain solid white background, no text, no watermark',
  border:
    'ornate decorative circular avatar frame border, empty center, plain solid white background, no text, no watermark',
}

export function isAiDesignEnabled(): boolean {
  return !!process.env.REPLICATE_API_TOKEN
}

function extractUrl(output: unknown): string | null {
  const first = Array.isArray(output) ? output[0] : output
  if (!first) return null
  if (typeof first === 'string') return first
  // El paquete replicate puede devolver FileOutput con .url() o convertible a string.
  const candidate = first as { url?: unknown }
  if (typeof candidate.url === 'function') {
    const u = (candidate.url as () => unknown)()
    return u instanceof URL ? u.href : String(u)
  }
  if (typeof candidate.url === 'string') return candidate.url
  const asString = String(first)
  return asString.startsWith('http') ? asString : null
}

export async function generateRewardImage(opts: {
  prompt: string
  type: RewardType
  sketchUrl?: string | null
}): Promise<GenerateResult> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return { ok: false, error: 'IA no configurada (falta REPLICATE_API_TOKEN)' }

  const cleanPrompt = opts.prompt.trim()
  if (cleanPrompt.length < 3) return { ok: false, error: 'Prompt demasiado corto' }

  const prompt = `${cleanPrompt}, ${TYPE_HINTS[opts.type]}`
  const isImg2img = !!opts.sketchUrl

  try {
    const { default: Replicate } = await import('replicate')
    const replicate = new Replicate({ auth: token })

    const model = isImg2img
      ? process.env.REPLICATE_IMG2IMG_MODEL || 'black-forest-labs/flux-dev'
      : process.env.REPLICATE_IMAGE_MODEL || 'black-forest-labs/flux-schnell'

    const input: Record<string, unknown> = {
      prompt,
      aspect_ratio: '1:1',
      output_format: 'png',
      num_outputs: 1,
      disable_safety_checker: false,
    }

    if (isImg2img) {
      input.image = opts.sketchUrl
      input.prompt_strength = 0.8
    } else {
      input.go_fast = true
    }

    const output = await replicate.run(model as `${string}/${string}`, { input })
    const url = extractUrl(output)
    if (!url) return { ok: false, error: 'La IA no devolvió ninguna imagen' }

    const res = await fetch(url)
    if (!res.ok) return { ok: false, error: 'No se pudo descargar la imagen generada' }

    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length === 0) return { ok: false, error: 'La imagen generada está vacía' }

    return { ok: true, buffer, mime: 'image/png' }
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Error generando la imagen'
    if (/402|insufficient credit|payment required/i.test(raw)) {
      return {
        ok: false,
        error:
          'Replicate sin saldo. Agrega crédito en replicate.com/account/billing y espera unos minutos.',
      }
    }
    if (/401|unauthor|invalid token|authentication/i.test(raw)) {
      return { ok: false, error: 'Token de Replicate inválido. Revisa REPLICATE_API_TOKEN.' }
    }
    return { ok: false, error: raw }
  }
}

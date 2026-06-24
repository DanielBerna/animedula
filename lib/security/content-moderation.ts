export type ModerationResult =
  | { ok: true }
  | { ok: false; reason: string; code: 'profanity' | 'threat' | 'self_harm' | 'spam' | 'too_short' }

/** Palabras y frases bloqueadas (español + inglés básico). Ampliar según comunidad. */
const BLOCKED_TERMS = [
  'puto',
  'puta',
  'mierda',
  'pendejo',
  'pendeja',
  'idiota de mierda',
  'matate',
  'mátate',
  'suicid',
  'suicida',
  'kill yourself',
  'kys',
  'morite',
  'múrate',
  'negro de mierda',
  'marica',
  'faggot',
  'nigger',
  'nazi',
  'hitler',
  'violar',
  'violacion',
  'violación',
  'pedofil',
  'pedófil',
  'cp ',
  'porn infantil',
]

const THREAT_PATTERNS = [
  /\b(te voy a matar|te mato|te rompo|te voy a pegar|muérete|muerete)\b/i,
  /\b(i will kill you|kill you)\b/i,
  /\b(voy a encontrar donde vives)\b/i,
]

const SELF_HARM_PATTERNS = [
  /\b(cortarme|autolesion|autolesi[oó]n|no quiero vivir|quiero morir|me quiero suicidar)\b/i,
  /\b(kill myself|want to die|end my life)\b/i,
]

const SPAM_PATTERNS = [
  /(https?:\/\/[^\s]+){4,}/i,
  /(.)\1{12,}/,
]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s@.:/-]/g, ' ')
}

/**
 * Moderación de texto UGC: lenguaje ofensivo, amenazas, autolesión, spam.
 * No sustituye moderación humana; bloquea lo más grave en servidor.
 */
export function moderateUserText(
  text: string,
  opts?: { minLength?: number; maxLength?: number },
): ModerationResult {
  const trimmed = text.trim()
  const min = opts?.minLength ?? 1
  const max = opts?.maxLength ?? 8000

  if (trimmed.length < min) {
    return { ok: false, reason: 'El mensaje es demasiado corto.', code: 'too_short' }
  }
  if (trimmed.length > max) {
    return { ok: false, reason: 'El mensaje es demasiado largo.', code: 'spam' }
  }

  const norm = normalize(trimmed)

  for (const term of BLOCKED_TERMS) {
    const t = normalize(term)
    if (norm.includes(t)) {
      return {
        ok: false,
        reason: 'El mensaje contiene lenguaje no permitido en Animédula.',
        code: 'profanity',
      }
    }
  }

  for (const re of THREAT_PATTERNS) {
    if (re.test(trimmed)) {
      return {
        ok: false,
        reason: 'No se permiten amenazas ni acoso.',
        code: 'threat',
      }
    }
  }

  for (const re of SELF_HARM_PATTERNS) {
    if (re.test(trimmed)) {
      return {
        ok: false,
        reason:
          'Si necesitas apoyo, busca ayuda profesional. En México: Línea de la Vida 800 911 2000.',
        code: 'self_harm',
      }
    }
  }

  for (const re of SPAM_PATTERNS) {
    if (re.test(trimmed)) {
      return { ok: false, reason: 'El mensaje parece spam.', code: 'spam' }
    }
  }

  return { ok: true }
}

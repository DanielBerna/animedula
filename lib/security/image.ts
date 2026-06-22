const SIGNATURES: { mime: string; bytes: number[] }[] = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46] },
]

export function detectImageMime(buffer: Buffer): string | null {
  for (const sig of SIGNATURES) {
    if (buffer.length < sig.bytes.length) continue
    const match = sig.bytes.every((b, i) => buffer[i] === b)
    if (match) return sig.mime
  }
  return null
}

export function validateImageBuffer(buffer: Buffer, declaredType?: string): { ok: true; mime: string } | { ok: false } {
  const detected = detectImageMime(buffer)
  if (!detected) return { ok: false }
  if (declaredType && !declaredType.startsWith('image/')) return { ok: false }
  if (declaredType && !detected.startsWith(declaredType.split('/')[0])) {
    if (!(declaredType.includes('jpeg') && detected === 'image/jpeg')) return { ok: false }
  }
  return { ok: true, mime: detected }
}

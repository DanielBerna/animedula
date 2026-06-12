/** Clave pública de Supabase (publishable o anon legacy). */
export function getSupabasePublicKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

/** Clave de servidor (secret nueva o service_role legacy). */
export function getSupabaseSecretKey(): string | undefined {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export function isSupabasePublicConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && getSupabasePublicKey())
}

export function isSupabaseServerConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && getSupabaseSecretKey())
}

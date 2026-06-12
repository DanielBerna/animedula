import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabasePublicKey, isSupabasePublicConfigured } from './env'

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = getSupabasePublicKey()
  if (!url || !key) {
    throw new Error(
      'Supabase: define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    )
  }

  const cookieStore = await cookies()

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Component — cookies read-only; el middleware refresca la sesión.
        }
      },
    },
  })
}

export function isSupabaseAuthConfigured() {
  return isSupabasePublicConfigured()
}

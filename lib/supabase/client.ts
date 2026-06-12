import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublicKey, isSupabasePublicConfigured } from './env'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = getSupabasePublicKey()
  if (!url || !key) {
    throw new Error(
      'Supabase: define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    )
  }
  return createBrowserClient(url, key)
}

export function isSupabaseBrowserConfigured() {
  return isSupabasePublicConfigured()
}

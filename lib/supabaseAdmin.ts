import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseSecretKey, isSupabaseServerConfigured } from './supabase/env'

let client: SupabaseClient | null = null

export function isSupabaseConfigured() {
  return isSupabaseServerConfigured()
}

export function getSupabaseAdmin() {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = getSupabaseSecretKey()
  if (!url || !key) {
    throw new Error(
      'Supabase no configurado: define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY (o SUPABASE_SERVICE_ROLE_KEY legacy)',
    )
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return client
}

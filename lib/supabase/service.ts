import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSupabaseSecretKey } from './env'

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = getSupabaseSecretKey()
  if (!url || !key) return null
  return createSupabaseClient(url, key, { auth: { persistSession: false } })
}

import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '../supabase/client'

type Listener = () => void

let channel: RealtimeChannel | null = null
let userId: string | null = null
let refcount = 0
let setupPromise: Promise<void> | null = null
const listeners = new Set<Listener>()

function notifyAll() {
  for (const fn of listeners) {
    try {
      fn()
    } catch {
      /* ignore */
    }
  }
}

function teardown(supabase: ReturnType<typeof createClient>) {
  if (channel) {
    void supabase.removeChannel(channel)
    channel = null
  }
  userId = null
  setupPromise = null
}

async function ensureChannel(supabase: ReturnType<typeof createClient>) {
  if (channel) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  if (channel && userId === user.id) return

  if (channel) teardown(supabase)

  userId = user.id
  channel = supabase
    .channel(`notifications-${user.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      },
      () => notifyAll(),
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `recipient_id=eq.${user.id}`,
      },
      () => notifyAll(),
    )
    .subscribe()
}

/** Una sola suscripción Realtime compartida (Header monta 2 campanas). */
export function subscribeNotificationRealtime(onUpdate: Listener): () => void {
  listeners.add(onUpdate)
  refcount += 1

  const supabase = createClient()

  if (!setupPromise) {
    setupPromise = ensureChannel(supabase).catch(() => {
      setupPromise = null
    })
  }

  return () => {
    listeners.delete(onUpdate)
    refcount -= 1
    if (refcount <= 0) {
      teardown(supabase)
      listeners.clear()
      refcount = 0
    }
  }
}

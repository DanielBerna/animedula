import { createClient, isSupabaseAuthConfigured } from '../supabase/server'

export type AdminDashboardStats = {
  pending_editorial: number
  pending_ugc: number
  pending_aportes: number
  published_reviews: number
  total_users: number
  premium_users: number
  shop_items: number
  badges: number
  income_mxn_cents: number
  expenses_mxn_cents: number
  recent_events: {
    id: number
    status: string
    amount_mxn_cents: number | null
    provider: string
    created_at: string
  }[]
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const empty: AdminDashboardStats = {
    pending_editorial: 0,
    pending_ugc: 0,
    pending_aportes: 0,
    published_reviews: 0,
    total_users: 0,
    premium_users: 0,
    shop_items: 0,
    badges: 0,
    income_mxn_cents: 0,
    expenses_mxn_cents: 0,
    recent_events: [],
  }

  if (!isSupabaseAuthConfigured()) return empty

  const supabase = await createClient()

  const [
    editorial,
    ugc,
    aportes,
    published,
    users,
    premium,
    shop,
    badges,
    events,
    expenses,
  ] = await Promise.all([
    supabase
      .from('editorial_reviews')
      .select('id', { count: 'exact', head: true })
      .in('status', ['draft', 'pending']),
    supabase.from('user_reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('community_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('editorial_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_premium', true),
    supabase.from('shop_items').select('id', { count: 'exact', head: true }),
    supabase.from('badges').select('id', { count: 'exact', head: true }),
    supabase
      .from('subscription_events')
      .select('id, status, amount_mxn_cents, provider, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('admin_expenses').select('amount_mxn_cents'),
  ])

  const paidEvents = (events.data || []).filter((e) => e.status === 'paid')
  const income = paidEvents.reduce((s, e) => s + (e.amount_mxn_cents || 0), 0)
  const expenseTotal = (expenses.data || []).reduce((s, e) => s + (e.amount_mxn_cents || 0), 0)

  return {
    pending_editorial: editorial.count ?? 0,
    pending_ugc: ugc.count ?? 0,
    pending_aportes: aportes.count ?? 0,
    published_reviews: published.count ?? 0,
    total_users: users.count ?? 0,
    premium_users: premium.count ?? 0,
    shop_items: shop.count ?? 0,
    badges: badges.count ?? 0,
    income_mxn_cents: income,
    expenses_mxn_cents: expenseTotal,
    recent_events: (events.data || []) as AdminDashboardStats['recent_events'],
  }
}

export function formatMxn(cents: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100)
}

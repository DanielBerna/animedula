import { NextRequest } from 'next/server'
import { requireAdmin, requireEditor } from '../../../../lib/auth'
import { formatMxn } from '../../../../lib/admin/stats'
import { getSupabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabaseAdmin'
import { requireRateLimit } from '../../../../lib/security/api'

export async function GET() {
  const editor = await requireEditor()
  if (!editor) return Response.json({ error: 'No autorizado' }, { status: 403 })
  if (!isSupabaseConfigured()) {
    return Response.json({ events: [], expenses: [], summary: { income: 0, expenses: 0, balance: 0, income_label: '$0.00' } })
  }

  const admin = getSupabaseAdmin()
  const [eventsRes, expensesRes, plansRes] = await Promise.all([
    admin
      .from('subscription_events')
      .select('id, user_id, plan_slug, provider, amount_mxn_cents, status, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    admin
      .from('admin_expenses')
      .select('id, label, category, amount_mxn_cents, notes, expense_date, created_at')
      .order('expense_date', { ascending: false })
      .limit(100),
    admin.from('subscription_plans').select('slug, name, price_mxn_cents, is_active'),
  ])

  const events = eventsRes.data || []
  const expenses = expensesRes.data || []
  const income = events
    .filter((e) => e.status === 'paid')
    .reduce((s, e) => s + (e.amount_mxn_cents || 0), 0)
  const expenseTotal = expenses.reduce((s, e) => s + (e.amount_mxn_cents || 0), 0)

  return Response.json({
    events,
    expenses,
    plans: plansRes.data || [],
    summary: {
      income,
      expenses: expenseTotal,
      balance: income - expenseTotal,
      income_label: formatMxn(income),
      expenses_label: formatMxn(expenseTotal),
      balance_label: formatMxn(income - expenseTotal),
    },
  })
}

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'mutation', 'admin-finance')
  if (limited) return limited

  const adminUser = await requireAdmin()
  if (!adminUser) return Response.json({ error: 'Solo administradores' }, { status: 403 })
  if (!isSupabaseConfigured()) return Response.json({ error: 'No disponible' }, { status: 503 })

  const body = await req.json()
  const action = body.action as string

  const db = getSupabaseAdmin()

  if (action === 'add_expense') {
    const label = String(body.label || '').trim()
    const amount_mxn = Number(body.amount_mxn)
    if (!label || !Number.isFinite(amount_mxn) || amount_mxn < 0) {
      return Response.json({ error: 'Datos inválidos' }, { status: 400 })
    }
    const { error } = await db.from('admin_expenses').insert({
      label: label.slice(0, 120),
      category: String(body.category || 'general'),
      amount_mxn_cents: Math.round(amount_mxn * 100),
      notes: body.notes ? String(body.notes).slice(0, 400) : null,
      expense_date: body.expense_date || new Date().toISOString().slice(0, 10),
      created_by: adminUser.id,
    })
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  }

  if (action === 'manual_income') {
    const user_id = String(body.user_id || adminUser.id)
    const amount_mxn = Number(body.amount_mxn)
    const plan_slug = body.plan_slug ? String(body.plan_slug) : null
    if (!Number.isFinite(amount_mxn)) return Response.json({ error: 'Monto inválido' }, { status: 400 })

    const { error } = await db.from('subscription_events').insert({
      user_id,
      plan_slug,
      provider: 'manual',
      amount_mxn_cents: Math.round(amount_mxn * 100),
      status: 'paid',
      metadata: { note: body.note || 'Registro manual admin' },
    })
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  }

  return Response.json({ error: 'Acción inválida' }, { status: 400 })
}

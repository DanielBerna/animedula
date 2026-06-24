'use client'

import { useEffect, useState } from 'react'
import { useToast } from '../../components/ToastProvider'

type Summary = {
  income: number
  expenses: number
  balance: number
  income_label: string
  expenses_label: string
  balance_label: string
}

export default function AdminFinancePanel() {
  const { showToast } = useToast()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [events, setEvents] = useState<unknown[]>([])
  const [expenses, setExpenses] = useState<unknown[]>([])
  const [expenseForm, setExpenseForm] = useState({
    label: '',
    amount_mxn: '',
    category: 'ia',
    notes: '',
  })

  const load = () => {
    fetch('/api/admin/finance')
      .then((r) => r.json())
      .then((d) => {
        setSummary(d.summary)
        setEvents(d.events || [])
        setExpenses(d.expenses || [])
      })
  }

  useEffect(() => {
    load()
  }, [])

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_expense', ...expenseForm, amount_mxn: Number(expenseForm.amount_mxn) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast({ title: 'Gasto registrado', description: expenseForm.label })
      setExpenseForm({ label: '', amount_mxn: '', category: 'ia', notes: '' })
      load()
    } catch (err: unknown) {
      showToast({ title: 'Error', description: err instanceof Error ? err.message : 'Error' })
    }
  }

  return (
    <div className="admin-page space-y-8">
      <header>
        <p className="eyebrow mb-1">Finanzas</p>
        <h1 className="page-title">Ingresos y gastos</h1>
        <p className="text-sm text-muted mt-2">
          Pagos desde <code className="text-xs">subscription_events</code>. Registra gastos manualmente (IA, hosting, dominio).
        </p>
      </header>

      {summary ? (
        <div className="admin-stat-grid">
          <div className="admin-stat-card card-glass">
            <p className="admin-stat-label">Ingresos</p>
            <p className="admin-stat-value text-emerald-400">{summary.income_label}</p>
          </div>
          <div className="admin-stat-card card-glass">
            <p className="admin-stat-label">Gastos</p>
            <p className="admin-stat-value text-sakura">{summary.expenses_label}</p>
          </div>
          <div className="admin-stat-card card-glass">
            <p className="admin-stat-label">Balance</p>
            <p className="admin-stat-value">{summary.balance_label}</p>
          </div>
        </div>
      ) : null}

      <section className="card-glass p-6">
        <h2 className="font-display font-semibold text-text mb-4">Registrar gasto</h2>
        <form onSubmit={addExpense} className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
          <input
            className="input text-sm"
            placeholder="Concepto (ej. Replicate IA)"
            value={expenseForm.label}
            onChange={(e) => setExpenseForm({ ...expenseForm, label: e.target.value })}
            required
          />
          <input
            className="input text-sm"
            type="number"
            step="0.01"
            placeholder="Monto MXN"
            value={expenseForm.amount_mxn}
            onChange={(e) => setExpenseForm({ ...expenseForm, amount_mxn: e.target.value })}
            required
          />
          <select
            className="input text-sm"
            value={expenseForm.category}
            onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
          >
            <option value="ia">IA</option>
            <option value="hosting">Hosting</option>
            <option value="dominio">Dominio</option>
            <option value="pagos">Comisiones pagos</option>
            <option value="marketing">Marketing</option>
            <option value="general">General</option>
          </select>
          <button type="submit" className="btn-primary text-xs sm:col-span-2 w-fit">
            Guardar gasto
          </button>
        </form>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card-glass p-6">
          <h2 className="font-display font-semibold text-text mb-3">Pagos / ingresos</h2>
          <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
            {(events as { id: number; provider: string; status: string; amount_mxn_cents: number | null; created_at: string }[]).map(
              (e) => (
                <li key={e.id} className="flex justify-between gap-2 border-b border-white/5 pb-2">
                  <span className="text-muted">
                    {e.provider} · {e.status}
                  </span>
                  <span>{e.amount_mxn_cents != null ? `$${(e.amount_mxn_cents / 100).toFixed(2)}` : '—'}</span>
                </li>
              ),
            )}
            {events.length === 0 ? <li className="text-faint text-xs">Sin eventos aún</li> : null}
          </ul>
        </section>
        <section className="card-glass p-6">
          <h2 className="font-display font-semibold text-text mb-3">Gastos</h2>
          <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
            {(expenses as { id: number; label: string; category: string; amount_mxn_cents: number; expense_date: string }[]).map(
              (e) => (
                <li key={e.id} className="flex justify-between gap-2 border-b border-white/5 pb-2">
                  <span>
                    {e.label}{' '}
                    <span className="text-faint text-[10px]">({e.category})</span>
                  </span>
                  <span>${(e.amount_mxn_cents / 100).toFixed(2)}</span>
                </li>
              ),
            )}
            {expenses.length === 0 ? <li className="text-faint text-xs">Registra tu primer gasto arriba</li> : null}
          </ul>
        </section>
      </div>
    </div>
  )
}

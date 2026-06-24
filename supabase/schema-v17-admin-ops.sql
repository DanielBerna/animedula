-- v17 — Operaciones admin: gastos, metadata premios, lectura staff
-- Ejecutar después de v9/v14/v16

alter table public.shop_items
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.badges
  add column if not exists is_active boolean not null default true;

-- Gastos operativos (IA, hosting, dominio, etc.) — registro manual admin
create table if not exists public.admin_expenses (
  id bigint generated always as identity primary key,
  label text not null check (char_length(label) between 2 and 120),
  category text not null default 'general'
    check (category in ('ia', 'hosting', 'dominio', 'pagos', 'marketing', 'general')),
  amount_mxn_cents integer not null check (amount_mxn_cents >= 0),
  notes text,
  expense_date date not null default (timezone('utc', now()))::date,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists admin_expenses_date_idx on public.admin_expenses (expense_date desc);

alter table public.admin_expenses enable row level security;

-- Sin políticas client: solo service role / APIs admin

-- Storage premios (crear bucket público "rewards" en dashboard)
drop policy if exists "Rewards lectura pública" on storage.objects;
create policy "Rewards lectura pública"
  on storage.objects for select using (bucket_id = 'rewards');

drop policy if exists "Admin sube rewards" on storage.objects;
create policy "Admin sube rewards"
  on storage.objects for insert with check (
    bucket_id = 'rewards'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('editor', 'admin')
    )
  );

drop policy if exists "Admin actualiza rewards" on storage.objects;
create policy "Admin actualiza rewards"
  on storage.objects for update using (
    bucket_id = 'rewards'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('editor', 'admin')
    )
  );

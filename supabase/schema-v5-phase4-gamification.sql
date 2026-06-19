-- Animédula — Fase 4: monedas, misiones diarias y títulos
-- Ejecutar DESPUÉS de schema-v2-community.sql

alter table public.profiles
  add column if not exists coins integer not null default 0;

-- Títulos desbloqueables por nivel
create table if not exists public.selectable_titles (
  id bigint generated always as identity primary key,
  slug text unique not null,
  name text not null,
  min_level integer not null default 1
);

insert into public.selectable_titles (slug, name, min_level) values
  ('novato', 'Novato', 1),
  ('rango-s', 'Rango S', 5),
  ('pirata-sombrero', 'Pirata de Sombrero de Paja', 10),
  ('cazador-trofeos', 'Cazador de Trofeos', 15)
on conflict (slug) do nothing;

alter table public.selectable_titles enable row level security;
create policy "Títulos públicos" on public.selectable_titles for select using (true);

-- Misiones diarias completadas
create table if not exists public.daily_missions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  mission_key text not null check (mission_key in ('visit', 'comment', 'review', 'list')),
  mission_date date not null default (timezone('utc', now()))::date,
  coins_awarded integer not null default 10,
  created_at timestamptz not null default now(),
  unique (user_id, mission_key, mission_date)
);

alter table public.daily_missions enable row level security;

create policy "Usuario ve sus misiones"
  on public.daily_missions for select using (auth.uid() = user_id);

create policy "Usuario completa misión"
  on public.daily_missions for insert with check (auth.uid() = user_id);

-- Cosméticos de tienda (sin dinero real)
create table if not exists public.shop_items (
  id bigint generated always as identity primary key,
  slug text unique not null,
  name text not null,
  description text not null,
  price_coins integer not null check (price_coins > 0),
  item_type text not null check (item_type in ('avatar_border', 'sticker_pack')),
  css_class text
);

insert into public.shop_items (slug, name, description, price_coins, item_type, css_class) values
  ('border-sakura', 'Borde Sakura', 'Marco rosa animado para tu avatar.', 50, 'avatar_border', 'cosmetic-border-sakura'),
  ('border-neon', 'Borde Neón', 'Gradiente cyan-magenta en el foro.', 80, 'avatar_border', 'cosmetic-border-neon'),
  ('stickers-otaku', 'Pack Otaku', 'Stickers exclusivos en el editor del foro.', 100, 'sticker_pack', 'sticker-pack-otaku')
on conflict (slug) do nothing;

create table if not exists public.user_inventory (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id bigint not null references public.shop_items (id) on delete cascade,
  equipped boolean not null default false,
  purchased_at timestamptz not null default now(),
  unique (user_id, item_id)
);

alter table public.shop_items enable row level security;
alter table public.user_inventory enable row level security;

create policy "Tienda visible" on public.shop_items for select using (true);
create policy "Usuario ve inventario" on public.user_inventory for select using (auth.uid() = user_id);
create policy "Usuario compra" on public.user_inventory for insert with check (auth.uid() = user_id);
create policy "Usuario equipa" on public.user_inventory for update using (auth.uid() = user_id);

-- Sumar monedas
create or replace function public.award_coins(p_user_id uuid, p_amount integer)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set coins = coins + p_amount
  where id = p_user_id;
end;
$$;

-- Insignia Fundador (usuarios antes de 2026-07-01)
insert into public.user_badges (user_id, badge_id)
select p.id, b.id
from public.profiles p
cross join public.badges b
where b.slug = 'fundador'
  and p.created_at < '2026-07-01'::timestamptz
on conflict (user_id, badge_id) do nothing;

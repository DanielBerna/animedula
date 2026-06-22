-- schema-v9-premium.sql
-- Premium, planes y eventos de suscripción.
-- Ejecutar DESPUÉS de schema-v8-security.sql

-- Planes disponibles (catálogo de suscripción)
create table if not exists public.subscription_plans (
  slug text primary key,
  name text not null,
  description text not null default '',
  price_mxn_cents integer not null check (price_mxn_cents > 0),
  interval_months integer not null default 1 check (interval_months > 0),
  perks jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.subscription_plans (slug, name, description, price_mxn_cents, perks, sort_order) values
  (
    'animedula-plus',
    'Animédula+',
    'Sin anuncios, marco premium, insignia exclusiva y cosméticos extra.',
    7900,
    '["sin_ads","marco_premium","badge_plus","tienda_extra"]'::jsonb,
    1
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price_mxn_cents = excluded.price_mxn_cents,
  perks = excluded.perks;

alter table public.profiles
  add column if not exists is_premium boolean not null default false,
  add column if not exists premium_until timestamptz,
  add column if not exists premium_plan text references public.subscription_plans (slug);

-- Eventos de pago (auditoría; webhooks Stripe/MP escriben aquí vía service role)
create table if not exists public.subscription_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_slug text references public.subscription_plans (slug),
  provider text not null check (provider in ('stripe', 'mercadopago', 'manual', 'admin')),
  provider_event_id text,
  amount_mxn_cents integer,
  status text not null check (status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists subscription_events_user_idx on public.subscription_events (user_id, created_at desc);

alter table public.subscription_plans enable row level security;
alter table public.subscription_events enable row level security;

drop policy if exists "Planes visibles" on public.subscription_plans;
create policy "Planes visibles"
  on public.subscription_plans for select using (is_active = true);

drop policy if exists "Usuario ve sus eventos" on public.subscription_events;
create policy "Usuario ve sus eventos"
  on public.subscription_events for select using (auth.uid() = user_id);

-- Cosméticos premium extra en tienda (compatible con BD legacy: price, category, asset_url)
update public.shop_items set price = coalesce(price, price_coins, 50) where price is null;
update public.shop_items set asset_url = coalesce(asset_url, '') where asset_url is null;

insert into public.shop_items (slug, name, description, price_coins, item_type, css_class, price, category, asset_url)
select v.slug, v.name, v.description, v.price_coins, v.item_type, v.css_class, v.price_coins, v.legacy_category, ''
from (values
  ('border-legendary', 'Marco Legendario', 'Borde dorado con brillo para tu avatar.', 200, 'avatar_border', 'cosmetic-border-legendary', 'cosmetic'),
  ('border-holographic', 'Marco Holográfico', 'Gradiente iridiscente estilo premium.', 250, 'avatar_border', 'cosmetic-border-holo', 'cosmetic')
) as v(slug, name, description, price_coins, item_type, css_class, legacy_category)
where not exists (select 1 from public.shop_items s where s.slug = v.slug);

-- Insignia premium (manual o webhook)
insert into public.badges (slug, name, description, category, icon_url) values
  ('animedula-plus', 'Animédula+', 'Miembro premium del sitio.', 'premium', '')
on conflict (slug) do nothing;

-- Admin de prueba: descomenta y pon tu email
-- update public.profiles
-- set is_premium = true, premium_until = now() + interval '1 year', premium_plan = 'animedula-plus'
-- where id = (select id from auth.users where email = 'tu@email.com');

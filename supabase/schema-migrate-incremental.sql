-- =============================================================================
-- Animédula — MIGRACIÓN INCREMENTAL
-- Para tu BD actual (profiles, reviews, user_coins, user_items, etc.)
--
-- CÓMO USAR:
--   1. Supabase Dashboard → SQL Editor → pegar y Run (todo el archivo).
--   2. Storage → New bucket → id "captures" → Public ON.
--   3. Database → Replication → activar forum_posts, post_reactions.
--
-- IDEMPOTENTE: usa IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
-- NO borra tablas antiguas (reviews→user_reviews renombra; user_coins queda
--   como legacy — puedes dropearla manualmente tras verificar).
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES — columnas que faltan
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists username text,
  add column if not exists status_text text,
  add column if not exists current_action text default 'idle',
  add column if not exists coins integer not null default 0,
  add column if not exists is_public boolean not null default true,
  add column if not exists list_public boolean not null default true;

-- Normalizar xp / level (en tu BD son nullable)
update public.profiles set xp = 0 where xp is null;
update public.profiles set level = 1 where level is null;
update public.profiles set selected_title = 'Novato' where selected_title is null;

alter table public.profiles
  alter column xp set default 0,
  alter column level set default 1;

do $$ begin
  alter table public.profiles alter column xp set not null;
exception when others then null;
end $$;

do $$ begin
  alter table public.profiles alter column level set not null;
exception when others then null;
end $$;

do $$ begin
  alter table public.profiles
    add constraint profiles_current_action_check
    check (current_action in ('idle', 'watching', 'reading', 'playing'));
exception when duplicate_object then null;
end $$;

create unique index if not exists profiles_username_key on public.profiles (username);
create index if not exists profiles_username_idx on public.profiles (username);

-- Migrar monedas desde user_coins → profiles.coins
do $$ begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_coins'
  ) then
    update public.profiles p
    set coins = greatest(p.coins, coalesce(uc.coins, 0))
    from public.user_coins uc
    where uc.user_id = p.id;
  end if;
end $$;

-- Username helper + trigger registro
create or replace function public.make_username(base text, uid uuid)
returns text language plpgsql as $$
declare
  slug text; candidate text; n integer := 0;
begin
  slug := lower(regexp_replace(coalesce(nullif(trim(base), ''), 'fan'), '[^a-z0-9]', '', 'g'));
  if length(slug) < 3 then
    slug := 'fan' || substr(replace(uid::text, '-', ''), 1, 6);
  end if;
  slug := left(slug, 20);
  candidate := slug;
  while exists (select 1 from public.profiles where username = candidate and id <> uid) loop
    n := n + 1;
    candidate := left(slug, 16) || n::text;
  end loop;
  return candidate;
end;
$$;

update public.profiles p
set username = public.make_username(coalesce(p.display_name, p.id::text), p.id)
where p.username is null;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare uname text; dname text;
begin
  dname := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );
  uname := public.make_username(dname, new.id);
  insert into public.profiles (id, display_name, avatar_url, username)
  values (new.id, dname, new.raw_user_meta_data->>'avatar_url', uname)
  on conflict (id) do update set
    display_name = excluded.display_name,
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    username = coalesce(public.profiles.username, excluded.username);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
drop policy if exists "Perfiles públicos legibles" on public.profiles;
create policy "Perfiles públicos legibles" on public.profiles for select using (true);
drop policy if exists "Usuario edita su perfil" on public.profiles;
create policy "Usuario edita su perfil" on public.profiles for update using (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. REVIEWS → user_reviews (la app usa user_reviews, no reviews)
-- ─────────────────────────────────────────────────────────────────────────────
do $$ begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'reviews'
  ) and not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_reviews'
  ) then
    alter table public.reviews rename to user_reviews;
  end if;
end $$;

create table if not exists public.user_reviews (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content_id text not null,
  content_type text not null check (content_type in ('anime', 'manga', 'game', 'movie')),
  rating_global smallint not null check (rating_global between 1 and 10),
  metrics_json jsonb default '{}',
  comment text not null,
  is_spoiler boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, content_type, content_id)
);

create index if not exists user_reviews_content_idx
  on public.user_reviews (content_type, content_id, created_at desc);

alter table public.user_reviews enable row level security;
drop policy if exists "Reseñas UGC públicas" on public.user_reviews;
create policy "Reseñas UGC públicas" on public.user_reviews for select using (true);
drop policy if exists "Usuario publica reseña" on public.user_reviews;
create policy "Usuario publica reseña" on public.user_reviews for insert with check (auth.uid() = user_id);
drop policy if exists "Usuario edita su reseña" on public.user_reviews;
create policy "Usuario edita su reseña" on public.user_reviews for update using (auth.uid() = user_id);
drop policy if exists "Usuario elimina su reseña" on public.user_reviews;
create policy "Usuario elimina su reseña" on public.user_reviews for delete using (auth.uid() = user_id);

-- review_votes: asegurar FK hacia user_reviews
do $$ begin
  if exists (
    select 1 from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'review_votes'
      and constraint_type = 'FOREIGN KEY'
  ) then
    -- FK existente se mantiene si ya apunta a user_reviews tras el rename
    null;
  end if;
end $$;

alter table public.review_votes enable row level security;
drop policy if exists "Votos visibles" on public.review_votes;
create policy "Votos visibles" on public.review_votes for select using (true);
drop policy if exists "Usuario vota" on public.review_votes;
create policy "Usuario vota" on public.review_votes for insert with check (auth.uid() = user_id);
drop policy if exists "Usuario cambia su voto" on public.review_votes;
create policy "Usuario cambia su voto" on public.review_votes for update using (auth.uid() = user_id);
drop policy if exists "Usuario elimina su voto" on public.review_votes;
create policy "Usuario elimina su voto" on public.review_votes for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. BADGES — añadir slug (tu tabla no lo tiene)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.badges add column if not exists slug text;

-- Tu BD exige icon_url NOT NULL; la app no lo usa pero hay que cumplir la constraint
alter table public.badges alter column icon_url set default '';
update public.badges set icon_url = coalesce(icon_url, '') where icon_url is null;

update public.badges
set slug = lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'))
where slug is null or slug = '';

create unique index if not exists badges_slug_key on public.badges (slug);

alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
drop policy if exists "Insignias públicas" on public.badges;
create policy "Insignias públicas" on public.badges for select using (true);
drop policy if exists "Insignias de usuario visibles" on public.user_badges;
create policy "Insignias de usuario visibles" on public.user_badges for select using (true);

insert into public.badges (slug, name, description, category, icon_url)
select v.slug, v.name, v.description, v.category, v.icon_url
from (values
  ('fundador', 'Fundador', 'Usuario de las primeras semanas de Animédula.', 'especial', ''),
  ('primera-resena', 'Primera reseña', 'Publicaste tu primera reseña de usuario.', 'contenido', ''),
  ('comentarista', 'Comentarista', 'Dejaste 10 comentarios en fichas.', 'comunidad', '')
) as v(slug, name, description, category, icon_url)
where not exists (select 1 from public.badges b where b.slug = v.slug);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SHOP — adaptar shop_items + user_items → user_inventory
-- (Ejecuta esta sección completa; el bloque DO crea columnas antes de insertar)
-- ─────────────────────────────────────────────────────────────────────────────
do $$ begin
  alter table public.shop_items add column if not exists slug text;
  alter table public.shop_items add column if not exists price_coins integer;
  alter table public.shop_items add column if not exists item_type text;
  alter table public.shop_items add column if not exists css_class text;
end $$;

update public.shop_items
set slug = lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'))
where slug is null;

update public.shop_items
set price_coins = coalesce(price_coins, price, 50)
where price_coins is null;

update public.shop_items
set item_type = coalesce(item_type, 'avatar_border')
where item_type is null;

update public.shop_items
set css_class = coalesce(css_class, 'cosmetic-' || coalesce(slug, 'item'))
where css_class is null;

create unique index if not exists shop_items_slug_key on public.shop_items (slug);

alter table public.shop_items drop constraint if exists shop_items_category_check;

do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'shop_items' and column_name = 'price'
  ) then
    update public.shop_items set price = coalesce(price, price_coins, 50) where price is null;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'shop_items' and column_name = 'category'
  ) then
    update public.shop_items
    set category = case
      when item_type = 'sticker_pack' then 'sticker'
      when item_type = 'avatar_border' then 'cosmetic'
      else coalesce(nullif(category, ''), 'cosmetic')
    end
    where category is null or category in ('avatar_border', 'sticker_pack');
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'shop_items' and column_name = 'asset_url'
  ) then
    update public.shop_items set asset_url = coalesce(asset_url, '') where asset_url is null;
    alter table public.shop_items alter column asset_url set default '';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'shop_items' and column_name = 'slug'
  ) then
    raise exception 'Faltan columnas en shop_items. Ejecuta la sección 4 desde el inicio.';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'shop_items' and column_name = 'price'
  ) then
    insert into public.shop_items (slug, name, description, price_coins, item_type, css_class, price, category, asset_url)
    select v.slug, v.name, v.description, v.price_coins, v.item_type, v.css_class, v.price_coins, v.legacy_category, ''
    from (values
      ('border-sakura', 'Borde Sakura', 'Marco rosa animado para tu avatar.', 50, 'avatar_border', 'cosmetic-border-sakura', 'cosmetic'),
      ('border-neon', 'Borde Neón', 'Gradiente cyan-magenta en el foro.', 80, 'avatar_border', 'cosmetic-border-neon', 'cosmetic'),
      ('stickers-otaku', 'Pack Otaku', 'Stickers exclusivos en el editor del foro.', 100, 'sticker_pack', 'sticker-pack-otaku', 'sticker')
    ) as v(slug, name, description, price_coins, item_type, css_class, legacy_category)
    where not exists (select 1 from public.shop_items s where s.slug = v.slug);
  else
    insert into public.shop_items (slug, name, description, price_coins, item_type, css_class)
    select v.slug, v.name, v.description, v.price_coins, v.item_type, v.css_class
    from (values
      ('border-sakura', 'Borde Sakura', 'Marco rosa animado para tu avatar.', 50, 'avatar_border', 'cosmetic-border-sakura'),
      ('border-neon', 'Borde Neón', 'Gradiente cyan-magenta en el foro.', 80, 'avatar_border', 'cosmetic-border-neon'),
      ('stickers-otaku', 'Pack Otaku', 'Stickers exclusivos en el editor del foro.', 100, 'sticker_pack', 'sticker-pack-otaku')
    ) as v(slug, name, description, price_coins, item_type, css_class)
    where not exists (select 1 from public.shop_items s where s.slug = v.slug);
  end if;
end $$;

-- user_items → user_inventory
do $$ begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_items'
  ) and not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_inventory'
  ) then
    alter table public.user_items rename to user_inventory;
  end if;
end $$;

create table if not exists public.user_inventory (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id bigint not null references public.shop_items (id) on delete cascade,
  equipped boolean not null default false,
  purchased_at timestamptz not null default now(),
  unique (user_id, item_id)
);

alter table public.user_inventory
  add column if not exists equipped boolean not null default false;

-- Si venía de user_items con acquired_at
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_inventory' and column_name = 'acquired_at'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_inventory' and column_name = 'purchased_at'
  ) then
    alter table public.user_inventory rename column acquired_at to purchased_at;
  end if;
end $$;

alter table public.user_inventory
  add column if not exists purchased_at timestamptz not null default now();

alter table public.shop_items enable row level security;
alter table public.user_inventory enable row level security;
drop policy if exists "Tienda visible" on public.shop_items;
create policy "Tienda visible" on public.shop_items for select using (true);
drop policy if exists "Usuario ve inventario" on public.user_inventory;
create policy "Usuario ve inventario" on public.user_inventory for select using (auth.uid() = user_id);
drop policy if exists "Usuario compra" on public.user_inventory;
create policy "Usuario compra" on public.user_inventory for insert with check (auth.uid() = user_id);
drop policy if exists "Usuario equipa" on public.user_inventory;
create policy "Usuario equipa" on public.user_inventory for update using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. TABLAS NUEVAS (no existen en tu BD)
-- ─────────────────────────────────────────────────────────────────────────────

-- Listas personales
create table if not exists public.user_lists (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content_id text not null,
  content_type text not null check (content_type in ('anime', 'manga', 'game', 'movie')),
  title text not null,
  image_url text,
  status text not null default 'pending'
    check (status in ('pending', 'watching', 'completed', 'dropped')),
  updated_at timestamptz not null default now(),
  unique (user_id, content_type, content_id)
);
create index if not exists user_lists_user_idx on public.user_lists (user_id, updated_at desc);
alter table public.user_lists enable row level security;
drop policy if exists "Usuario ve su lista" on public.user_lists;
drop policy if exists "Listas públicas visibles" on public.user_lists;
create policy "Listas públicas visibles" on public.user_lists for select using (
  auth.uid() = user_id
  or exists (
    select 1 from public.profiles pr
    where pr.id = user_lists.user_id and pr.is_public = true and pr.list_public = true
  )
);
drop policy if exists "Usuario gestiona su lista" on public.user_lists;
create policy "Usuario gestiona su lista" on public.user_lists for insert with check (auth.uid() = user_id);
drop policy if exists "Usuario actualiza su lista" on public.user_lists;
create policy "Usuario actualiza su lista" on public.user_lists for update using (auth.uid() = user_id);
drop policy if exists "Usuario borra de su lista" on public.user_lists;
create policy "Usuario borra de su lista" on public.user_lists for delete using (auth.uid() = user_id);

-- Foro
create table if not exists public.forum_posts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 5 and 200),
  body text not null check (char_length(body) between 10 and 8000),
  tags text[] default '{}',
  content_id text,
  content_type text,
  parent_id bigint references public.forum_posts (id) on delete cascade,
  reply_count integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.forum_posts add column if not exists parent_id bigint references public.forum_posts (id) on delete cascade;
create index if not exists forum_posts_tags_idx on public.forum_posts using gin (tags);
create index if not exists forum_posts_content_idx on public.forum_posts (content_type, content_id);
create index if not exists forum_posts_parent_idx on public.forum_posts (parent_id);
alter table public.forum_posts enable row level security;
drop policy if exists "Posts públicos" on public.forum_posts;
create policy "Posts públicos" on public.forum_posts for select using (true);
drop policy if exists "Usuario crea post" on public.forum_posts;
create policy "Usuario crea post" on public.forum_posts for insert with check (auth.uid() = user_id);

create table if not exists public.post_reactions (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.forum_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null check (emoji in ('hype', 'sad_otaku', 'gg')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id, emoji)
);
create index if not exists post_reactions_post_idx on public.post_reactions (post_id);
alter table public.post_reactions enable row level security;
drop policy if exists "Reacciones visibles" on public.post_reactions;
create policy "Reacciones visibles" on public.post_reactions for select using (true);
drop policy if exists "Usuario reacciona" on public.post_reactions;
create policy "Usuario reacciona" on public.post_reactions for insert with check (auth.uid() = user_id);
drop policy if exists "Usuario quita reacción" on public.post_reactions;
create policy "Usuario quita reacción" on public.post_reactions for delete using (auth.uid() = user_id);

-- XP
create table if not exists public.xp_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);
alter table public.xp_events enable row level security;
drop policy if exists "Usuario ve su XP" on public.xp_events;
create policy "Usuario ve su XP" on public.xp_events for select using (auth.uid() = user_id);

-- Títulos desbloqueables
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
drop policy if exists "Títulos públicos" on public.selectable_titles;
create policy "Títulos públicos" on public.selectable_titles for select using (true);

-- Misiones diarias
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
drop policy if exists "Usuario ve sus misiones" on public.daily_missions;
create policy "Usuario ve sus misiones" on public.daily_missions for select using (auth.uid() = user_id);
drop policy if exists "Usuario completa misión" on public.daily_missions;
create policy "Usuario completa misión" on public.daily_missions for insert with check (auth.uid() = user_id);

-- Capturas
create table if not exists public.content_screenshots (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content_type text not null check (content_type in ('anime', 'manga', 'game', 'movie')),
  content_id text not null,
  storage_path text not null,
  caption text check (char_length(caption) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists content_screenshots_ficha_idx
  on public.content_screenshots (content_type, content_id, created_at desc);
alter table public.content_screenshots enable row level security;
drop policy if exists "Capturas públicas" on public.content_screenshots;
create policy "Capturas públicas" on public.content_screenshots for select using (true);
drop policy if exists "Usuario sube captura" on public.content_screenshots;
create policy "Usuario sube captura" on public.content_screenshots for insert with check (auth.uid() = user_id);
drop policy if exists "Usuario borra su captura" on public.content_screenshots;
create policy "Usuario borra su captura" on public.content_screenshots for delete using (auth.uid() = user_id);

-- Storage (bucket "captures" debe existir en la UI)
drop policy if exists "Capturas públicas lectura" on storage.objects;
create policy "Capturas públicas lectura"
  on storage.objects for select using (bucket_id = 'captures');
drop policy if exists "Usuario sube a captures" on storage.objects;
create policy "Usuario sube a captures"
  on storage.objects for insert with check (
    bucket_id = 'captures' and auth.uid()::text = (storage.foldername(name))[1]
  );
drop policy if exists "Usuario borra su archivo captures" on storage.objects;
create policy "Usuario borra su archivo captures"
  on storage.objects for delete using (
    bucket_id = 'captures' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. FUNCIONES + TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.award_xp(p_user_id uuid, p_amount integer, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.xp_events (user_id, amount, reason) values (p_user_id, p_amount, p_reason);
  update public.profiles
  set xp = xp + p_amount, level = greatest(1, (xp + p_amount) / 500 + 1)
  where id = p_user_id;
end;
$$;

create or replace function public.award_coins(p_user_id uuid, p_amount integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set coins = coins + p_amount where id = p_user_id;
end;
$$;

create or replace function public.on_comment_xp()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.award_xp(new.user_id, 10, 'comment'); return new; end;
$$;

create or replace function public.on_user_review_xp()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.award_xp(new.user_id, 50, 'review'); return new; end;
$$;

create or replace function public.grant_first_review_badge()
returns trigger language plpgsql security definer set search_path = public as $$
declare badge_row public.badges%rowtype;
begin
  select * into badge_row from public.badges where slug = 'primera-resena' limit 1;
  if badge_row.id is not null then
    insert into public.user_badges (user_id, badge_id)
    values (new.user_id, badge_row.id) on conflict (user_id, badge_id) do nothing;
  end if;
  return new;
end;
$$;

create or replace function public.check_comentarista_badge()
returns trigger language plpgsql security definer set search_path = public as $$
declare cnt integer; badge_row public.badges%rowtype;
begin
  select count(*) into cnt from public.comments where user_id = new.user_id and status = 'visible';
  if cnt >= 10 then
    select * into badge_row from public.badges where slug = 'comentarista' limit 1;
    if badge_row.id is not null then
      insert into public.user_badges (user_id, badge_id)
      values (new.user_id, badge_row.id) on conflict (user_id, badge_id) do nothing;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.bump_reply_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.parent_id is not null then
    update public.forum_posts set reply_count = reply_count + 1 where id = new.parent_id;
  end if;
  return new;
end;
$$;

create or replace function public.on_forum_post_xp()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.award_xp(new.user_id, 10, 'forum_post'); return new; end;
$$;

drop trigger if exists comment_awards_xp on public.comments;
create trigger comment_awards_xp after insert on public.comments for each row execute function public.on_comment_xp();
drop trigger if exists comment_comentarista_badge on public.comments;
create trigger comment_comentarista_badge after insert on public.comments for each row execute function public.check_comentarista_badge();
drop trigger if exists user_review_awards_xp on public.user_reviews;
create trigger user_review_awards_xp after insert on public.user_reviews for each row execute function public.on_user_review_xp();
drop trigger if exists user_review_first_badge on public.user_reviews;
create trigger user_review_first_badge after insert on public.user_reviews for each row execute function public.grant_first_review_badge();
drop trigger if exists forum_post_reply_count on public.forum_posts;
create trigger forum_post_reply_count after insert on public.forum_posts for each row execute function public.bump_reply_count();
drop trigger if exists forum_post_awards_xp on public.forum_posts;
create trigger forum_post_awards_xp after insert on public.forum_posts for each row execute function public.on_forum_post_xp();

-- Insignia Fundador (usuarios antes de julio 2026)
insert into public.user_badges (user_id, badge_id)
select p.id, b.id from public.profiles p
cross join public.badges b
where b.slug = 'fundador' and p.created_at < '2026-07-01'::timestamptz
on conflict (user_id, badge_id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. VERIFICACIÓN (opcional — revisa el resultado en Results)
-- ─────────────────────────────────────────────────────────────────────────────
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'user_reviews', 'user_lists', 'forum_posts', 'post_reactions',
    'xp_events', 'selectable_titles', 'daily_missions', 'user_inventory',
    'content_screenshots'
  )
order by table_name;

-- Opcional: hacerte admin (cambia el email)
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'tu@email.com');

-- Opcional: limpiar tablas legacy cuando todo funcione
-- drop table if exists public.user_coins;

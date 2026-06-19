-- =============================================================================
-- Animédula — ESQUEMA COMPLETO (consolidado)
-- Versión: 2026-06-12
--
-- USO:
--   • Proyecto NUEVO en Supabase: ejecuta este archivo completo (Run).
--   • Ya tienes schema.sql antiguo: también puedes ejecutarlo; usa IF NOT EXISTS
--     y ADD COLUMN IF NOT EXISTS (idempotente).
--
-- DESPUÉS del SQL:
--   1. Authentication → URL Configuration (Site URL + /auth/callback)
--   2. Database → Replication → activar Realtime en:
--        forum_posts, post_reactions
--   3. Promover admin (al final de este archivo, descomenta y cambia email)
--
-- COSTE: todo esto vive en el plan gratis de Supabase hasta cierto volumen.
--        Noticias en la app usan RSS (sin APIs de pago).
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PERFILES
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'user'
    check (role in ('user', 'contributor', 'editor', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists username text unique,
  add column if not exists xp integer not null default 0,
  add column if not exists level integer not null default 1,
  add column if not exists selected_title text default 'Novato',
  add column if not exists status_text text,
  add column if not exists current_action text default 'idle',
  add column if not exists coins integer not null default 0,
  add column if not exists is_public boolean not null default true,
  add column if not exists list_public boolean not null default true;

-- Restricción current_action (si la columna ya existía sin check)
do $$ begin
  alter table public.profiles
    add constraint profiles_current_action_check
    check (current_action in ('idle', 'watching', 'reading', 'playing'));
exception when duplicate_object then null;
end $$;

create index if not exists profiles_username_idx on public.profiles (username);

alter table public.profiles enable row level security;

drop policy if exists "Perfiles públicos legibles" on public.profiles;
create policy "Perfiles públicos legibles"
  on public.profiles for select using (true);

drop policy if exists "Usuario edita su perfil" on public.profiles;
create policy "Usuario edita su perfil"
  on public.profiles for update using (auth.uid() = id);

-- Username único al registrarse
create or replace function public.make_username(base text, uid uuid)
returns text
language plpgsql
as $$
declare
  slug text;
  candidate text;
  n integer := 0;
begin
  slug := lower(regexp_replace(
    coalesce(nullif(trim(base), ''), 'fan'),
    '[^a-z0-9]', '', 'g'
  ));
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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  uname text;
  dname text;
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

-- Backfill username en cuentas existentes
update public.profiles p
set username = public.make_username(coalesce(p.display_name, p.id::text), p.id)
where p.username is null;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RESEÑAS EDITORIALES + MODERACIÓN
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.editorial_reviews (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('anime', 'manga')),
  mal_id integer not null,
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'published', 'rejected')),
  gancho text not null default '',
  por_que text not null default '',
  para_quien text not null default '',
  no_para text not null default '',
  contexto_practico text not null default '',
  veredicto text not null default 'Con reservas'
    check (veredicto in ('Recomendado', 'Con reservas', 'Solo para fans del género')),
  source text not null default 'ai'
    check (source in ('ai', 'human', 'community')),
  author_id uuid references public.profiles (id) on delete set null,
  reviewer_id uuid references public.profiles (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists editorial_reviews_one_published
  on public.editorial_reviews (kind, mal_id) where status = 'published';
create index if not exists editorial_reviews_status_idx
  on public.editorial_reviews (status, updated_at desc);

alter table public.editorial_reviews enable row level security;

drop policy if exists "Reseñas publicadas visibles para todos" on public.editorial_reviews;
create policy "Reseñas publicadas visibles para todos"
  on public.editorial_reviews for select using (status = 'published');

drop policy if exists "Editores leen todas las reseñas" on public.editorial_reviews;
create policy "Editores leen todas las reseñas"
  on public.editorial_reviews for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin'))
  );

drop policy if exists "Editores gestionan reseñas" on public.editorial_reviews;
create policy "Editores gestionan reseñas"
  on public.editorial_reviews for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin'))
  );

create table if not exists public.review_moderation_log (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.editorial_reviews (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null check (action in ('submit', 'approve', 'reject', 'edit')),
  note text,
  created_at timestamptz not null default now()
);

alter table public.review_moderation_log enable row level security;

drop policy if exists "Editores ven log" on public.review_moderation_log;
create policy "Editores ven log"
  on public.review_moderation_log for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin'))
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. COMENTARIOS EN FICHAS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('anime', 'manga')),
  mal_id integer not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'visible'
    check (status in ('visible', 'hidden', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comments_ficha_idx
  on public.comments (kind, mal_id, created_at desc) where status = 'visible';

alter table public.comments enable row level security;

drop policy if exists "Comentarios visibles públicos" on public.comments;
create policy "Comentarios visibles públicos"
  on public.comments for select using (status = 'visible');

drop policy if exists "Usuarios autenticados comentan" on public.comments;
create policy "Usuarios autenticados comentan"
  on public.comments for insert with check (auth.uid() = user_id);

drop policy if exists "Autor edita su comentario" on public.comments;
create policy "Autor edita su comentario"
  on public.comments for update using (auth.uid() = user_id);

drop policy if exists "Editores moderan comentarios" on public.comments;
create policy "Editores moderan comentarios"
  on public.comments for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin'))
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. APORTES EDITORIALES (COMUNIDAD)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.community_submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('anime', 'manga')),
  mal_id integer not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  field text not null check (field in (
    'gancho', 'por_que', 'para_quien', 'no_para', 'contexto_practico', 'veredicto'
  )),
  body text not null check (char_length(body) between 10 and 1500),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.community_submissions enable row level security;

drop policy if exists "Usuario ve sus aportes" on public.community_submissions;
create policy "Usuario ve sus aportes"
  on public.community_submissions for select using (auth.uid() = user_id);

drop policy if exists "Editores ven cola de aportes" on public.community_submissions;
create policy "Editores ven cola de aportes"
  on public.community_submissions for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('editor', 'admin'))
  );

drop policy if exists "Colaboradores envían aportes" on public.community_submissions;
create policy "Colaboradores envían aportes"
  on public.community_submissions for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('user', 'contributor', 'editor', 'admin')
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. LISTAS PERSONALES (anime, manga, juegos…)
-- ─────────────────────────────────────────────────────────────────────────────
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
create policy "Listas públicas visibles"
  on public.user_lists for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles pr
      where pr.id = user_lists.user_id and pr.is_public = true and pr.list_public = true
    )
  );

drop policy if exists "Usuario gestiona su lista" on public.user_lists;
create policy "Usuario gestiona su lista"
  on public.user_lists for insert with check (auth.uid() = user_id);

drop policy if exists "Usuario actualiza su lista" on public.user_lists;
create policy "Usuario actualiza su lista"
  on public.user_lists for update using (auth.uid() = user_id);

drop policy if exists "Usuario borra de su lista" on public.user_lists;
create policy "Usuario borra de su lista"
  on public.user_lists for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. RESEÑAS UGC + VOTOS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.user_reviews (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content_id text not null,
  content_type text not null check (content_type in ('anime', 'manga', 'game', 'movie')),
  rating_global smallint not null check (rating_global between 1 and 10),
  metrics_json jsonb default '{}',
  comment text not null check (char_length(comment) between 20 and 4000),
  is_spoiler boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, content_type, content_id)
);

create index if not exists user_reviews_content_idx
  on public.user_reviews (content_type, content_id, created_at desc);

alter table public.user_reviews enable row level security;

drop policy if exists "Reseñas UGC públicas" on public.user_reviews;
create policy "Reseñas UGC públicas"
  on public.user_reviews for select using (true);

drop policy if exists "Usuario publica reseña" on public.user_reviews;
create policy "Usuario publica reseña"
  on public.user_reviews for insert with check (auth.uid() = user_id);

drop policy if exists "Usuario edita su reseña" on public.user_reviews;
create policy "Usuario edita su reseña"
  on public.user_reviews for update using (auth.uid() = user_id);

drop policy if exists "Usuario elimina su reseña" on public.user_reviews;
create policy "Usuario elimina su reseña"
  on public.user_reviews for delete using (auth.uid() = user_id);

create table if not exists public.review_votes (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  review_id bigint not null references public.user_reviews (id) on delete cascade,
  vote_type text not null check (vote_type in ('up', 'down')),
  unique (user_id, review_id)
);

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
-- 7. FORO + REACCIONES
-- ─────────────────────────────────────────────────────────────────────────────
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

alter table public.forum_posts
  add column if not exists parent_id bigint references public.forum_posts (id) on delete cascade;

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

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. INSIGNIAS + XP
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.badges (
  id bigint generated always as identity primary key,
  slug text unique not null,
  name text not null,
  description text not null,
  icon_url text,
  category text not null default 'general'
);

create table if not exists public.user_badges (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id bigint not null references public.badges (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

drop policy if exists "Insignias públicas" on public.badges;
create policy "Insignias públicas" on public.badges for select using (true);

drop policy if exists "Insignias de usuario visibles" on public.user_badges;
create policy "Insignias de usuario visibles" on public.user_badges for select using (true);

insert into public.badges (slug, name, description, category) values
  ('fundador', 'Fundador', 'Usuario de las primeras semanas de Animédula.', 'especial'),
  ('primera-resena', 'Primera reseña', 'Publicaste tu primera reseña de usuario.', 'contenido'),
  ('comentarista', 'Comentarista', 'Dejaste 10 comentarios en fichas.', 'comunidad')
on conflict (slug) do nothing;

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

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. GAMIFICACIÓN: TÍTULOS, MISIONES, TIENDA
-- ─────────────────────────────────────────────────────────────────────────────
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
create policy "Usuario ve sus misiones"
  on public.daily_missions for select using (auth.uid() = user_id);

drop policy if exists "Usuario completa misión" on public.daily_missions;
create policy "Usuario completa misión"
  on public.daily_missions for insert with check (auth.uid() = user_id);

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

drop policy if exists "Tienda visible" on public.shop_items;
create policy "Tienda visible" on public.shop_items for select using (true);

drop policy if exists "Usuario ve inventario" on public.user_inventory;
create policy "Usuario ve inventario" on public.user_inventory for select using (auth.uid() = user_id);

drop policy if exists "Usuario compra" on public.user_inventory;
create policy "Usuario compra" on public.user_inventory for insert with check (auth.uid() = user_id);

drop policy if exists "Usuario equipa" on public.user_inventory;
create policy "Usuario equipa" on public.user_inventory for update using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. LEGACY: anime_cache (APIs admin / cron)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.anime_cache (
  mal_id integer primary key,
  title text,
  raw jsonb,
  estado text default 'borrador'
    check (estado in ('borrador', 'publicado', 'rechazado')),
  updated_at timestamptz default now()
);

alter table public.anime_cache enable row level security;

drop policy if exists "Solo servicio/admin en anime_cache" on public.anime_cache;
create policy "Solo servicio/admin en anime_cache"
  on public.anime_cache for all using (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. FUNCIONES: XP, MONEDAS, FORO
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.award_xp(p_user_id uuid, p_amount integer, p_reason text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.xp_events (user_id, amount, reason)
  values (p_user_id, p_amount, p_reason);

  update public.profiles
  set xp = xp + p_amount,
      level = greatest(1, (xp + p_amount) / 500 + 1)
  where id = p_user_id;
end;
$$;

create or replace function public.award_coins(p_user_id uuid, p_amount integer)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles set coins = coins + p_amount where id = p_user_id;
end;
$$;

create or replace function public.on_comment_xp()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.award_xp(new.user_id, 10, 'comment');
  return new;
end;
$$;

create or replace function public.on_user_review_xp()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.award_xp(new.user_id, 50, 'review');
  return new;
end;
$$;

create or replace function public.grant_first_review_badge()
returns trigger language plpgsql security definer set search_path = public as $$
declare badge_row public.badges%rowtype;
begin
  select * into badge_row from public.badges where slug = 'primera-resena' limit 1;
  if badge_row.id is not null then
    insert into public.user_badges (user_id, badge_id)
    values (new.user_id, badge_row.id)
    on conflict (user_id, badge_id) do nothing;
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
      values (new.user_id, badge_row.id)
      on conflict (user_id, badge_id) do nothing;
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
begin
  perform public.award_xp(new.user_id, 10, 'forum_post');
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────
drop trigger if exists comment_awards_xp on public.comments;
create trigger comment_awards_xp
  after insert on public.comments for each row execute function public.on_comment_xp();

drop trigger if exists comment_comentarista_badge on public.comments;
create trigger comment_comentarista_badge
  after insert on public.comments for each row execute function public.check_comentarista_badge();

drop trigger if exists user_review_awards_xp on public.user_reviews;
create trigger user_review_awards_xp
  after insert on public.user_reviews for each row execute function public.on_user_review_xp();

drop trigger if exists user_review_first_badge on public.user_reviews;
create trigger user_review_first_badge
  after insert on public.user_reviews for each row execute function public.grant_first_review_badge();

drop trigger if exists forum_post_reply_count on public.forum_posts;
create trigger forum_post_reply_count
  after insert on public.forum_posts for each row execute function public.bump_reply_count();

drop trigger if exists forum_post_awards_xp on public.forum_posts;
create trigger forum_post_awards_xp
  after insert on public.forum_posts for each row execute function public.on_forum_post_xp();

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. DATOS INICIALES (insignia Fundador)
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.user_badges (user_id, badge_id)
select p.id, b.id
from public.profiles p
cross join public.badges b
where b.slug = 'fundador' and p.created_at < '2026-07-01'::timestamptz
on conflict (user_id, badge_id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. ADMIN (descomenta y cambia el email)
-- ─────────────────────────────────────────────────────────────────────────────
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'tu@email.com');

-- =============================================================================
-- 15. CAPTURAS (v7) — galería fans + Storage bucket "captures"
-- =============================================================================

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
create policy "Capturas públicas"
  on public.content_screenshots for select using (true);

drop policy if exists "Usuario sube captura" on public.content_screenshots;
create policy "Usuario sube captura"
  on public.content_screenshots for insert with check (auth.uid() = user_id);

drop policy if exists "Usuario borra su captura" on public.content_screenshots;
create policy "Usuario borra su captura"
  on public.content_screenshots for delete using (auth.uid() = user_id);

drop policy if exists "Capturas públicas lectura" on storage.objects;
create policy "Capturas públicas lectura"
  on storage.objects for select
  using (bucket_id = 'captures');

drop policy if exists "Usuario sube a captures" on storage.objects;
create policy "Usuario sube a captures"
  on storage.objects for insert
  with check (
    bucket_id = 'captures'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Usuario borra su archivo captures" on storage.objects;
create policy "Usuario borra su archivo captures"
  on storage.objects for delete
  using (
    bucket_id = 'captures'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================================================
-- PENDIENTE DEL PLAN (aún NO está en BD — implementar en futuras migraciones):
--
-- • storage bucket       — crear manualmente "captures" (público) en Supabase UI
-- • badge cinefilo-oro   — trigger al 50ª reseña content_type = 'movie'
-- • comments kind=game   — ampliar check en comments para videojuegos
-- • news_cache           — opcional caché RSS (gratis, sin API de pago)
-- =============================================================================

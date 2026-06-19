-- Animédula — Fase 2 comunidad y gamificación (ejecutar DESPUÉS de schema.sql)

-- ─── Perfil extendido ───
alter table public.profiles
  add column if not exists username text unique,
  add column if not exists xp integer not null default 0,
  add column if not exists level integer not null default 1,
  add column if not exists selected_title text default 'Novato',
  add column if not exists status_text text,
  add column if not exists current_action text default 'idle'
    check (current_action in ('idle', 'watching', 'reading', 'playing'));

-- ─── Listas unificadas (anime, manga, game…) ───
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

create policy "Usuario ve su lista"
  on public.user_lists for select using (auth.uid() = user_id);

create policy "Usuario gestiona su lista"
  on public.user_lists for all using (auth.uid() = user_id);

-- ─── Reseñas de usuarios (UGC) ───
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

create policy "Reseñas UGC públicas"
  on public.user_reviews for select using (true);

create policy "Usuario publica reseña"
  on public.user_reviews for insert with check (auth.uid() = user_id);

create policy "Usuario edita su reseña"
  on public.user_reviews for update using (auth.uid() = user_id);

-- ─── Votos de utilidad ───
create table if not exists public.review_votes (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  review_id bigint not null references public.user_reviews (id) on delete cascade,
  vote_type text not null check (vote_type in ('up', 'down')),
  unique (user_id, review_id)
);

alter table public.review_votes enable row level security;

create policy "Votos visibles"
  on public.review_votes for select using (true);

create policy "Usuario vota"
  on public.review_votes for insert with check (auth.uid() = user_id);

create policy "Usuario cambia su voto"
  on public.review_votes for update using (auth.uid() = user_id);

-- ─── Foro polimórfico ───
create table if not exists public.forum_posts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 5 and 200),
  body text not null check (char_length(body) between 10 and 8000),
  tags text[] default '{}',
  content_id text,
  content_type text,
  reply_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists forum_posts_tags_idx on public.forum_posts using gin (tags);
create index if not exists forum_posts_content_idx on public.forum_posts (content_type, content_id);

alter table public.forum_posts enable row level security;

create policy "Posts públicos"
  on public.forum_posts for select using (true);

create policy "Usuario crea post"
  on public.forum_posts for insert with check (auth.uid() = user_id);

-- ─── Insignias ───
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

create policy "Insignias públicas" on public.badges for select using (true);
create policy "Insignias de usuario visibles" on public.user_badges for select using (true);

-- Semillas de insignias
insert into public.badges (slug, name, description, category) values
  ('fundador', 'Fundador', 'Usuario de las primeras semanas de Animédula.', 'especial'),
  ('primera-resena', 'Primera reseña', 'Publicaste tu primera reseña de usuario.', 'contenido'),
  ('comentarista', 'Comentarista', 'Dejaste 10 comentarios en fichas.', 'comunidad')
on conflict (slug) do nothing;

-- ─── XP ledger ───
create table if not exists public.xp_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.xp_events enable row level security;

create policy "Usuario ve su XP"
  on public.xp_events for select using (auth.uid() = user_id);

-- Función: sumar XP y subir nivel (cada 500 XP = 1 nivel)
create or replace function public.award_xp(p_user_id uuid, p_amount integer, p_reason text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  new_xp integer;
  new_level integer;
begin
  insert into public.xp_events (user_id, amount, reason)
  values (p_user_id, p_amount, p_reason);

  update public.profiles
  set xp = xp + p_amount,
      level = greatest(1, (xp + p_amount) / 500 + 1)
  where id = p_user_id;
end;
$$;

-- XP al comentar
create or replace function public.on_comment_xp()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.award_xp(new.user_id, 10, 'comment');
  return new;
end;
$$;

drop trigger if exists comment_awards_xp on public.comments;
create trigger comment_awards_xp
  after insert on public.comments
  for each row execute function public.on_comment_xp();

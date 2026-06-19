-- Animédula — Fase 3: foro ampliado, reacciones y estado de perfil
-- Ejecutar DESPUÉS de schema-v2-community.sql

alter table public.forum_posts
  add column if not exists parent_id bigint references public.forum_posts (id) on delete cascade;

create index if not exists forum_posts_parent_idx on public.forum_posts (parent_id);

-- Reacciones emoji temáticas
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

create policy "Reacciones visibles"
  on public.post_reactions for select using (true);

create policy "Usuario reacciona"
  on public.post_reactions for insert with check (auth.uid() = user_id);

create policy "Usuario quita reacción"
  on public.post_reactions for delete using (auth.uid() = user_id);

-- Actualizar contador de respuestas
create or replace function public.bump_reply_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.parent_id is not null then
    update public.forum_posts
    set reply_count = reply_count + 1
    where id = new.parent_id;
  end if;
  return new;
end;
$$;

drop trigger if exists forum_post_reply_count on public.forum_posts;
create trigger forum_post_reply_count
  after insert on public.forum_posts
  for each row execute function public.bump_reply_count();

-- XP al crear post del foro
create or replace function public.on_forum_post_xp()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.award_xp(new.user_id, 10, 'forum_post');
  return new;
end;
$$;

drop trigger if exists forum_post_awards_xp on public.forum_posts;
create trigger forum_post_awards_xp
  after insert on public.forum_posts
  for each row execute function public.on_forum_post_xp();

-- Insignia comentarista (10 comentarios en fichas)
create or replace function public.check_comentarista_badge()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  cnt integer;
  badge_row public.badges%rowtype;
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

drop trigger if exists comment_comentarista_badge on public.comments;
create trigger comment_comentarista_badge
  after insert on public.comments
  for each row execute function public.check_comentarista_badge();

-- Realtime: activar en Dashboard → Database → Replication → forum_posts, post_reactions

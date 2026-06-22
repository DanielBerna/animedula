-- v13 — Moderación UGC + seguir usuarios
-- Ejecutar en Supabase SQL Editor

-- ─── Reseñas UGC: estado de moderación ─────────────────────────────────────
alter table public.user_reviews
  add column if not exists status text not null default 'published'
  check (status in ('pending', 'published', 'rejected'));

-- Reseñas ya existentes quedan publicadas; las nuevas van a revisión
alter table public.user_reviews alter column status set default 'pending';

create index if not exists user_reviews_status_idx
  on public.user_reviews (status, created_at desc);

drop policy if exists "Reseñas UGC públicas" on public.user_reviews;
create policy "Reseñas UGC visibles"
  on public.user_reviews for select using (
    status = 'published'
    or auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('editor', 'admin')
    )
  );

drop policy if exists "Editores moderan reseñas UGC" on public.user_reviews;
create policy "Editores moderan reseñas UGC"
  on public.user_reviews for update using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('editor', 'admin')
    )
  );

-- XP e insignia solo al publicar (no al enviar a cola)
create or replace function public.on_user_review_xp()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'published'
     and (tg_op = 'INSERT' or coalesce(old.status, '') is distinct from 'published') then
    perform public.award_xp(new.user_id, 50, 'review');
  end if;
  return new;
end;
$$;

create or replace function public.grant_first_review_badge()
returns trigger language plpgsql security definer set search_path = public as $$
declare badge_row public.badges%rowtype;
begin
  if new.status <> 'published' then
    return new;
  end if;
  if tg_op = 'UPDATE' and coalesce(old.status, '') = 'published' then
    return new;
  end if;
  select * into badge_row from public.badges where slug = 'primera-resena' limit 1;
  if badge_row.id is not null then
    insert into public.user_badges (user_id, badge_id)
    values (new.user_id, badge_row.id)
    on conflict (user_id, badge_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists user_review_awards_xp on public.user_reviews;
create trigger user_review_awards_xp
  after insert or update of status on public.user_reviews
  for each row execute function public.on_user_review_xp();

drop trigger if exists user_review_first_badge on public.user_reviews;
create trigger user_review_first_badge
  after insert or update of status on public.user_reviews
  for each row execute function public.grant_first_review_badge();

-- ─── Seguir usuarios ─────────────────────────────────────────────────────────
create table if not exists public.user_follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists user_follows_following_idx
  on public.user_follows (following_id, created_at desc);

create index if not exists user_follows_follower_idx
  on public.user_follows (follower_id, created_at desc);

alter table public.user_follows enable row level security;

drop policy if exists "Seguidores visibles" on public.user_follows;
create policy "Seguidores visibles"
  on public.user_follows for select using (true);

drop policy if exists "Usuario sigue" on public.user_follows;
create policy "Usuario sigue"
  on public.user_follows for insert with check (auth.uid() = follower_id);

drop policy if exists "Usuario deja de seguir" on public.user_follows;
create policy "Usuario deja de seguir"
  on public.user_follows for delete using (auth.uid() = follower_id);

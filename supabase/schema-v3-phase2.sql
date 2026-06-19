-- Animédula — Fase 2: triggers de reseñas e insignia primera reseña
-- Ejecutar DESPUÉS de schema-v2-community.sql

create or replace function public.on_user_review_xp()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.award_xp(new.user_id, 50, 'review');
  return new;
end;
$$;

drop trigger if exists user_review_awards_xp on public.user_reviews;
create trigger user_review_awards_xp
  after insert on public.user_reviews
  for each row execute function public.on_user_review_xp();

create or replace function public.grant_first_review_badge()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  badge_row public.badges%rowtype;
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

drop trigger if exists user_review_first_badge on public.user_reviews;
create trigger user_review_first_badge
  after insert on public.user_reviews
  for each row execute function public.grant_first_review_badge();

-- Política: usuario elimina su reseña
drop policy if exists "Usuario elimina su reseña" on public.user_reviews;
create policy "Usuario elimina su reseña"
  on public.user_reviews for delete using (auth.uid() = user_id);

drop policy if exists "Usuario elimina su voto" on public.review_votes;
create policy "Usuario elimina su voto"
  on public.review_votes for delete using (auth.uid() = user_id);

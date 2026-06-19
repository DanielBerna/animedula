-- Animédula — Perfiles públicos y visibilidad de listas
-- Ejecutar DESPUÉS de schema-v2-community.sql

alter table public.profiles
  add column if not exists is_public boolean not null default true,
  add column if not exists list_public boolean not null default true;

-- Generar username único desde display_name o email
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
    '[^a-z0-9]',
    '',
    'g'
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

-- Perfil al registrarse: incluir username
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
  values (
    new.id,
    dname,
    new.raw_user_meta_data->>'avatar_url',
    uname
  );
  return new;
end;
$$;

-- Backfill usernames faltantes
update public.profiles p
set username = public.make_username(coalesce(p.display_name, p.id::text), p.id)
where p.username is null;

-- Listas visibles en perfiles públicos
drop policy if exists "Listas públicas visibles" on public.user_lists;
create policy "Listas públicas visibles"
  on public.user_lists for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles pr
      where pr.id = user_lists.user_id
        and pr.is_public = true
        and pr.list_public = true
    )
  );

-- Índice para búsqueda por username
create index if not exists profiles_username_idx on public.profiles (username);

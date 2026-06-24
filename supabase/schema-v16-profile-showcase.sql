-- v16 — Perfil vitrina, proyectos, muro amigos, avatares
-- Ejecutar después de v14/v15

-- Intro proyectos / trabajo
alter table public.profiles
  add column if not exists projects_intro text;

-- Vitrina: 5 slots por anime, manga, juegos
create table if not exists public.profile_showcase (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  section text not null check (section in ('anime', 'manga', 'game')),
  slot smallint not null check (slot between 1 and 5),
  content_id text,
  title text not null check (char_length(title) between 1 and 200),
  image_url text,
  list_status text default 'watching'
    check (list_status in ('watching', 'completed', 'pending', 'dropped')),
  updated_at timestamptz not null default now(),
  unique (user_id, section, slot)
);

create index if not exists profile_showcase_user_idx
  on public.profile_showcase (user_id, section, slot);

alter table public.profile_showcase enable row level security;

drop policy if exists "Vitrina pública lectura" on public.profile_showcase;
create policy "Vitrina pública lectura"
  on public.profile_showcase for select using (
    exists (
      select 1 from public.profiles p
      where p.id = profile_showcase.user_id and p.is_public = true
    )
    or auth.uid() = user_id
  );

drop policy if exists "Usuario gestiona vitrina" on public.profile_showcase;
create policy "Usuario gestiona vitrina"
  on public.profile_showcase for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Proyectos / trabajo (5 slots)
create table if not exists public.profile_projects (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  slot smallint not null check (slot between 1 and 5),
  title text not null check (char_length(title) between 2 and 120),
  description text not null check (char_length(description) between 10 and 600),
  link_url text,
  updated_at timestamptz not null default now(),
  unique (user_id, slot)
);

alter table public.profile_projects enable row level security;

drop policy if exists "Proyectos públicos lectura" on public.profile_projects;
create policy "Proyectos públicos lectura"
  on public.profile_projects for select using (
    exists (
      select 1 from public.profiles p
      where p.id = profile_projects.user_id and p.is_public = true
    )
    or auth.uid() = user_id
  );

drop policy if exists "Usuario gestiona proyectos" on public.profile_projects;
create policy "Usuario gestiona proyectos"
  on public.profile_projects for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Comentarios en muro (solo amigos — ver función)
create or replace function public.are_profile_friends(viewer uuid, owner uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select viewer = owner
    or exists (
      select 1 from public.friend_requests fr
      where fr.status = 'accepted'
        and (
          (fr.requester_id = viewer and fr.addressee_id = owner)
          or (fr.requester_id = owner and fr.addressee_id = viewer)
        )
    );
$$;

create table if not exists public.profile_wall_comments (
  id bigint generated always as identity primary key,
  profile_user_id uuid not null references public.profiles (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  section text not null default 'general'
    check (section in ('general', 'anime', 'manga', 'game', 'projects')),
  body text not null check (char_length(body) between 2 and 500),
  status text not null default 'visible'
    check (status in ('visible', 'hidden', 'flagged')),
  created_at timestamptz not null default now()
);

create index if not exists profile_wall_comments_profile_idx
  on public.profile_wall_comments (profile_user_id, section, created_at desc);

alter table public.profile_wall_comments enable row level security;

drop policy if exists "Muro visible para amigos" on public.profile_wall_comments;
create policy "Muro visible para amigos"
  on public.profile_wall_comments for select using (
    status = 'visible'
    and public.are_profile_friends(auth.uid(), profile_user_id)
  );

drop policy if exists "Amigo comenta muro" on public.profile_wall_comments;
create policy "Amigo comenta muro"
  on public.profile_wall_comments for insert with check (
    auth.uid() = author_id
    and auth.uid() <> profile_user_id
    and public.are_profile_friends(auth.uid(), profile_user_id)
  );

-- Storage avatars (crear bucket "avatars" público en dashboard si no existe)
drop policy if exists "Avatares lectura pública" on storage.objects;
create policy "Avatares lectura pública"
  on storage.objects for select using (bucket_id = 'avatars');

drop policy if exists "Usuario sube avatar" on storage.objects;
create policy "Usuario sube avatar"
  on storage.objects for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Usuario actualiza avatar" on storage.objects;
create policy "Usuario actualiza avatar"
  on storage.objects for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Usuario borra avatar" on storage.objects;
create policy "Usuario borra avatar"
  on storage.objects for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Animédula — Capturas de usuarios (Supabase Storage)
-- Ejecutar después de schema-complete.sql
-- Luego: Storage → New bucket → id "captures" → Public bucket ON

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

-- Storage policies (bucket "captures" debe existir)
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

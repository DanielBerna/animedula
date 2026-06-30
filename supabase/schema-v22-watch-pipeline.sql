-- v22 — Pipeline continuo: prioridad de catálogo + aportes de enlaces
-- Ejecutar después de schema-v21-watch-mirrors.sql

alter table public.watch_media
  add column if not exists catalog_source text
    check (catalog_source is null or catalog_source in ('manual', 'top', 'seasonal', 'schedule', 'import', 'submission')),
  add column if not exists priority integer not null default 0,
  add column if not exists episodes_total integer;

create index if not exists watch_media_priority_idx
  on public.watch_media (priority desc, updated_at desc)
  where is_active = true;

-- Aportes de la comunidad / staff para llenar espejos
create table if not exists public.watch_source_submissions (
  id bigint generated always as identity primary key,
  mal_id integer not null,
  episode integer not null check (episode >= 1),
  lang text not null default 'lat' check (lang in ('lat', 'sub', 'dub')),
  source_type text not null default 'iframe'
    check (source_type in ('hls', 'mp4', 'iframe')),
  server_label text not null default 'Aporte'
    check (char_length(server_label) between 1 and 80),
  url text not null check (char_length(url) between 8 and 2048),
  referer text,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  submitted_by uuid references public.profiles (id) on delete set null,
  reviewed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists watch_source_submissions_status_idx
  on public.watch_source_submissions (status, created_at desc);

create index if not exists watch_source_submissions_mal_idx
  on public.watch_source_submissions (mal_id, episode);

alter table public.watch_source_submissions enable row level security;

-- Log ligero de corridas de ingesta (catálogo / feed)
create table if not exists public.watch_ingest_runs (
  id bigint generated always as identity primary key,
  job text not null check (char_length(job) between 2 and 60),
  shows_registered integer not null default 0,
  sources_added integer not null default 0,
  sources_skipped integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.watch_ingest_runs enable row level security;

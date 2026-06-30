-- v21 — Espejos propios para /ver (doblaje latino, HLS/MP4/iframe por episodio)
-- Ejecutar después de v17+. Solo service role / APIs admin escriben; lectura vía API.

create table if not exists public.watch_media (
  id bigint generated always as identity primary key,
  mal_id integer unique,
  anilist_id integer,
  title text not null check (char_length(title) between 1 and 240),
  slug text unique,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (mal_id is not null or anilist_id is not null)
);

create unique index if not exists watch_media_anilist_uidx
  on public.watch_media (anilist_id) where anilist_id is not null;

create index if not exists watch_media_mal_idx on public.watch_media (mal_id) where mal_id is not null;

create table if not exists public.watch_episode_sources (
  id bigint generated always as identity primary key,
  media_id bigint not null references public.watch_media (id) on delete cascade,
  episode integer not null check (episode >= 1),
  lang text not null check (lang in ('lat', 'sub', 'dub')),
  source_type text not null check (source_type in ('hls', 'mp4', 'iframe')),
  server_label text not null check (char_length(server_label) between 1 and 80),
  url text not null check (char_length(url) between 8 and 2048),
  referer text,
  quality text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists watch_episode_sources_lookup_idx
  on public.watch_episode_sources (media_id, episode, lang, sort_order)
  where is_active = true;

alter table public.watch_media enable row level security;
alter table public.watch_episode_sources enable row level security;

-- Sin políticas client: lectura/escritura solo vía service role en APIs.

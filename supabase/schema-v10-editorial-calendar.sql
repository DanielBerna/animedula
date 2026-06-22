-- schema-v10-editorial-calendar.sql
-- Calendario editorial: fechas programadas y temporada.
-- Ejecutar DESPUÉS de schema-v9-premium.sql

alter table public.editorial_reviews
  add column if not exists scheduled_publish_at timestamptz,
  add column if not exists display_title text,
  add column if not exists season_key text;

create index if not exists editorial_reviews_scheduled_idx
  on public.editorial_reviews (scheduled_publish_at)
  where status in ('draft', 'pending') and scheduled_publish_at is not null;

comment on column public.editorial_reviews.scheduled_publish_at is 'Fecha sugerida de publicación (cron auto-publica si está configurado)';
comment on column public.editorial_reviews.season_key is 'Ej: 2026-spring — temporada de estreno asociada';
comment on column public.editorial_reviews.display_title is 'Título legible en calendario admin';

-- v12 — Restricciones UNIQUE en reseñas y listas UGC
-- Corrige: "there is no unique or exclusion constraint matching the ON CONFLICT specification"
-- Ejecutar en Supabase SQL Editor si la tabla existía antes de schema-v2 (p. ej. renombrada desde reviews).

-- 1. Eliminar duplicados (conserva la reseña más reciente por usuario+contenido)
with ranked as (
  select id,
    row_number() over (
      partition by user_id, content_type, content_id
      order by created_at desc, id desc
    ) as rn
  from public.user_reviews
)
delete from public.user_reviews
where id in (select id from ranked where rn > 1);

create unique index if not exists user_reviews_user_content_uidx
  on public.user_reviews (user_id, content_type, content_id);

-- 2. Listas de usuario
with ranked as (
  select id,
    row_number() over (
      partition by user_id, content_type, content_id
      order by updated_at desc, id desc
    ) as rn
  from public.user_lists
)
delete from public.user_lists
where id in (select id from ranked where rn > 1);

create unique index if not exists user_lists_user_content_uidx
  on public.user_lists (user_id, content_type, content_id);

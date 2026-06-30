-- v20 · MéduCoins por actividad
-- Las actividades (comentar, reseñar, foro, lista) ahora acreditan MéduCoins
-- automáticamente una vez al día vía `daily_missions`. El CHECK original de
-- `mission_key` no incluía 'forum', por lo que esa misión fallaba al guardarse.
-- Aquí se reemplaza el CHECK para aceptar todas las claves vigentes.
--
-- Idempotente: se puede correr varias veces. Ejecutar en Supabase → SQL Editor.

do $$
declare
  c record;
begin
  -- Quitar cualquier CHECK sobre daily_missions.mission_key (el nombre puede variar)
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace n on n.oid = rel.relnamespace
    where n.nspname = 'public'
      and rel.relname = 'daily_missions'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%mission_key%'
  loop
    execute format('alter table public.daily_missions drop constraint %I', c.conname);
  end loop;

  alter table public.daily_missions
    add constraint daily_missions_mission_key_check
    check (mission_key in ('visit', 'comment', 'review', 'list', 'forum'));
end $$;

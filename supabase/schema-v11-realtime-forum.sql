-- schema-v11-realtime-forum.sql
-- Activa Realtime (postgres_changes) para el foro.
-- El cliente ya escucha en components/ForumThread.tsx
--
-- Alternativa UI: Supabase Dashboard → Database → Publications → supabase_realtime
-- → marcar forum_posts y post_reactions

-- Asegurar que las tablas existen en la publicación realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'forum_posts'
  ) then
    alter publication supabase_realtime add table public.forum_posts;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'post_reactions'
  ) then
    alter publication supabase_realtime add table public.post_reactions;
  end if;
end $$;

-- Opcional: replica identity FULL si en el futuro escuchas UPDATE con filtros por columna
-- (hoy el cliente solo recarga todo el hilo; DEFAULT basta)
-- alter table public.forum_posts replica identity full;
-- alter table public.post_reactions replica identity full;

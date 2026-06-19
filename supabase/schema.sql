-- Animédula — esquema inicial (LEGACY)
-- ⚠️ Usa supabase/schema-complete.sql para instalación o migración completa.
-- Este archivo se conserva como referencia histórica.

-- ─── Perfiles (extiende auth.users) ───
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'user'
    check (role in ('user', 'contributor', 'editor', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Perfiles públicos legibles"
  on public.profiles for select
  using (true);

create policy "Usuario edita su perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Reseñas editoriales ───
create table if not exists public.editorial_reviews (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('anime', 'manga')),
  mal_id integer not null,
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'published', 'rejected')),
  gancho text not null default '',
  por_que text not null default '',
  para_quien text not null default '',
  no_para text not null default '',
  contexto_practico text not null default '',
  veredicto text not null default 'Con reservas'
    check (veredicto in ('Recomendado', 'Con reservas', 'Solo para fans del género')),
  source text not null default 'ai'
    check (source in ('ai', 'human', 'community')),
  author_id uuid references public.profiles (id) on delete set null,
  reviewer_id uuid references public.profiles (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists editorial_reviews_one_published
  on public.editorial_reviews (kind, mal_id)
  where status = 'published';

create index if not exists editorial_reviews_status_idx
  on public.editorial_reviews (status, updated_at desc);

alter table public.editorial_reviews enable row level security;

create policy "Reseñas publicadas visibles para todos"
  on public.editorial_reviews for select
  using (status = 'published');

create policy "Editores leen todas las reseñas"
  on public.editorial_reviews for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('editor', 'admin')
    )
  );

create policy "Editores gestionan reseñas"
  on public.editorial_reviews for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('editor', 'admin')
    )
  );

-- ─── Log de moderación ───
create table if not exists public.review_moderation_log (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.editorial_reviews (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null check (action in ('submit', 'approve', 'reject', 'edit')),
  note text,
  created_at timestamptz not null default now()
);

alter table public.review_moderation_log enable row level security;

create policy "Editores ven log"
  on public.review_moderation_log for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('editor', 'admin')
    )
  );

-- ─── Comentarios comunidad ───
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('anime', 'manga')),
  mal_id integer not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'visible'
    check (status in ('visible', 'hidden', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comments_ficha_idx
  on public.comments (kind, mal_id, created_at desc)
  where status = 'visible';

alter table public.comments enable row level security;

create policy "Comentarios visibles públicos"
  on public.comments for select
  using (status = 'visible');

create policy "Usuarios autenticados comentan"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "Autor edita su comentario"
  on public.comments for update
  using (auth.uid() = user_id);

create policy "Editores moderan comentarios"
  on public.comments for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('editor', 'admin')
    )
  );

-- ─── Aportes de redacción (comunidad) ───
create table if not exists public.community_submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('anime', 'manga')),
  mal_id integer not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  field text not null
    check (field in ('gancho', 'por_que', 'para_quien', 'no_para', 'contexto_practico', 'veredicto')),
  body text not null check (char_length(body) between 10 and 1500),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.community_submissions enable row level security;

create policy "Usuario ve sus aportes"
  on public.community_submissions for select
  using (auth.uid() = user_id);

create policy "Editores ven cola de aportes"
  on public.community_submissions for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('editor', 'admin')
    )
  );

create policy "Colaboradores envían aportes"
  on public.community_submissions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('user', 'contributor', 'editor', 'admin')
    )
  );

-- ─── Legacy: anime_cache (ya referenciado en APIs actuales) ───
create table if not exists public.anime_cache (
  mal_id integer primary key,
  title text,
  raw jsonb,
  estado text default 'borrador'
    check (estado in ('borrador', 'publicado', 'rechazado')),
  updated_at timestamptz default now()
);

alter table public.anime_cache enable row level security;

create policy "Solo servicio/admin en anime_cache"
  on public.anime_cache for all
  using (false);

-- Nota: anime_cache se gestiona con SUPABASE_SERVICE_ROLE_KEY desde el servidor.

-- ─── Promover tu usuario a admin (cambiar el email) ───
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'tu@email.com');

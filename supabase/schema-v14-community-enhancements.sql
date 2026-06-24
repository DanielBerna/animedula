-- v14 — Comunidad: amistades, mensajes, notificaciones, misión foro
-- Ejecutar en Supabase SQL Editor después de v13

-- Misión diaria: participar en el foro
alter table public.daily_missions drop constraint if exists daily_missions_mission_key_check;
alter table public.daily_missions add constraint daily_missions_mission_key_check
  check (mission_key in ('visit', 'comment', 'review', 'list', 'forum'));

-- Editores pueden moderar aportes editoriales
drop policy if exists "Editores moderan aportes" on public.community_submissions;
create policy "Editores moderan aportes"
  on public.community_submissions for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('editor', 'admin')
    )
  );

-- Solicitudes de amistad (mutua)
create table if not exists public.friend_requests (
  id bigint generated always as identity primary key,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create index if not exists friend_requests_addressee_idx
  on public.friend_requests (addressee_id, status, created_at desc);

alter table public.friend_requests enable row level security;

drop policy if exists "Ver solicitudes propias" on public.friend_requests;
create policy "Ver solicitudes propias"
  on public.friend_requests for select using (
    auth.uid() = requester_id or auth.uid() = addressee_id
  );

drop policy if exists "Enviar solicitud" on public.friend_requests;
create policy "Enviar solicitud"
  on public.friend_requests for insert with check (auth.uid() = requester_id);

drop policy if exists "Responder solicitud" on public.friend_requests;
create policy "Responder solicitud"
  on public.friend_requests for update using (
    auth.uid() = addressee_id or auth.uid() = requester_id
  );

-- Mensajes directos (solo entre amigos aceptados — validado en API)
create table if not exists public.direct_messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index if not exists direct_messages_thread_idx
  on public.direct_messages (sender_id, recipient_id, created_at desc);

create index if not exists direct_messages_inbox_idx
  on public.direct_messages (recipient_id, read_at, created_at desc);

alter table public.direct_messages enable row level security;

drop policy if exists "Ver mensajes propios" on public.direct_messages;
create policy "Ver mensajes propios"
  on public.direct_messages for select using (
    auth.uid() = sender_id or auth.uid() = recipient_id
  );

drop policy if exists "Enviar mensaje" on public.direct_messages;
create policy "Enviar mensaje"
  on public.direct_messages for insert with check (auth.uid() = sender_id);

drop policy if exists "Marcar leído" on public.direct_messages;
create policy "Marcar leído"
  on public.direct_messages for update using (auth.uid() = recipient_id);

-- Notificaciones in-app
create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, read_at, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Ver notificaciones propias" on public.notifications;
create policy "Ver notificaciones propias"
  on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "Marcar notificación" on public.notifications;
create policy "Marcar notificación"
  on public.notifications for update using (auth.uid() = user_id);

-- Item especial: pack stickers premium (si no existe)
insert into public.shop_items (slug, name, description, price_coins, item_type, css_class, category, price, asset_url)
select
  'stickers-premium',
  'Pack Premium',
  'Stickers exclusivos Animédula+ para el foro.',
  150,
  'sticker_pack',
  'sticker-pack-premium',
  'sticker',
  150,
  ''
where not exists (select 1 from public.shop_items where slug = 'stickers-premium');

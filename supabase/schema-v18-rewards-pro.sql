-- v18 — Gestión de premios PRO: rareza, orden y metadata en insignias
-- Ejecutar después de v17.

-- Insignias: metadata (rareza, etc.) y orden de aparición
alter table public.badges
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.badges
  add column if not exists sort_order integer not null default 0;

-- Tienda (stickers/marcos): orden de aparición (la rareza vive en metadata.rarity)
alter table public.shop_items
  add column if not exists sort_order integer not null default 0;

create index if not exists badges_sort_idx on public.badges (sort_order);
create index if not exists shop_items_sort_idx on public.shop_items (sort_order);

-- Nota: el borrado/edición se hace vía API admin con service role (bypassa RLS),
-- por eso no se requieren políticas adicionales aquí.

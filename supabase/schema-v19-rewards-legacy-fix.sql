-- v19 · Repara columnas legacy de shop_items / badges que bloquean items
-- "gratis" o sin precio. En BDs antiguas existen columnas NOT NULL sin default
-- (price, category) que el CMS nuevo ya no envía. Aquí las hacemos opcionales
-- con un valor por defecto y rellenamos las filas existentes.
--
-- Es 100% idempotente: se puede correr varias veces sin efectos secundarios.
-- Ejecutar en Supabase → SQL Editor.

do $$
begin
  -- shop_items.price (legacy, distinta de price_coins)
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'shop_items' and column_name = 'price'
  ) then
    update public.shop_items set price = coalesce(price, price_coins, 0) where price is null;
    alter table public.shop_items alter column price drop not null;
    alter table public.shop_items alter column price set default 0;
  end if;

  -- shop_items.category (legacy)
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'shop_items' and column_name = 'category'
  ) then
    alter table public.shop_items drop constraint if exists shop_items_category_check;
    update public.shop_items set category = coalesce(nullif(category, ''), 'cosmetic') where category is null or category = '';
    alter table public.shop_items alter column category drop not null;
    alter table public.shop_items alter column category set default 'cosmetic';
  end if;

  -- price_coins: permitir 0 (items gratis) si tuviera el check (> 0)
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'shop_items' and column_name = 'price_coins'
  ) then
    alter table public.shop_items drop constraint if exists shop_items_price_coins_check;
    update public.shop_items set price_coins = coalesce(price_coins, 0) where price_coins is null;
    alter table public.shop_items alter column price_coins set default 0;
  end if;
end $$;

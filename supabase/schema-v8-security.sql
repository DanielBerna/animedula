-- schema-v8-security.sql
-- Endurecimiento: perfiles, economía, RPCs, privacidad, compras atómicas.
-- Ejecutar en Supabase SQL Editor después de migraciones previas.

-- ─── Helper: editor/admin ───────────────────────────────────────────────────
create or replace function public.is_editor_or_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('editor', 'admin')
  );
$$;

revoke all on function public.is_editor_or_admin() from public;
grant execute on function public.is_editor_or_admin() to authenticated, anon;

-- ─── Perfiles: bloquear escalada de privilegios/economía ────────────────────
create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() = old.id then
    new.role := old.role;
    new.coins := old.coins;
    new.xp := old.xp;
    new.level := old.level;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_privileged on public.profiles;
create trigger trg_protect_profile_privileged
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_fields();

-- Lectura: público solo si is_public; propio perfil; editores ven todo
drop policy if exists "Perfiles públicos legibles" on public.profiles;
drop policy if exists "Perfiles lectura" on public.profiles;
create policy "Perfiles lectura"
  on public.profiles for select using (
    is_public = true
    or auth.uid() = id
    or public.is_editor_or_admin()
  );

-- ─── RPC award_xp: solo propio usuario, montos acotados ─────────────────────
create or replace function public.award_xp(p_user_id uuid, p_amount integer, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'unauthorized';
  end if;
  if auth.uid() <> p_user_id then
    raise exception 'forbidden';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 100 then
    raise exception 'invalid_amount';
  end if;

  insert into public.xp_events (user_id, amount, reason)
  values (p_user_id, p_amount, left(coalesce(p_reason, ''), 120));

  update public.profiles
  set xp = xp + p_amount,
      level = greatest(1, (xp + p_amount) / 500 + 1)
  where id = p_user_id;
end;
$$;

-- ─── RPC award_coins: solo propio usuario, montos acotados ──────────────────
create or replace function public.award_coins(p_user_id uuid, p_amount integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'unauthorized';
  end if;
  if auth.uid() <> p_user_id then
    raise exception 'forbidden';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 50 then
    raise exception 'invalid_amount';
  end if;

  update public.profiles
  set coins = coins + p_amount
  where id = p_user_id;
end;
$$;

revoke all on function public.award_xp(uuid, integer, text) from public;
revoke all on function public.award_coins(uuid, integer) from public;
grant execute on function public.award_xp(uuid, integer, text) to authenticated;
grant execute on function public.award_coins(uuid, integer) to authenticated;

-- ─── Compra atómica en tienda ───────────────────────────────────────────────
create or replace function public.purchase_shop_item(p_item_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_item public.shop_items%rowtype;
  v_coins integer;
begin
  if v_user is null then
    raise exception 'unauthorized';
  end if;

  select * into v_item from public.shop_items where slug = p_item_slug;
  if not found then
    raise exception 'item_not_found';
  end if;

  if exists (
    select 1 from public.user_inventory
    where user_id = v_user and item_id = v_item.id
  ) then
    raise exception 'already_owned';
  end if;

  select coins into v_coins from public.profiles where id = v_user for update;
  if v_coins is null or v_coins < v_item.price_coins then
    raise exception 'insufficient_coins';
  end if;

  update public.profiles
  set coins = coins - v_item.price_coins
  where id = v_user;

  insert into public.user_inventory (user_id, item_id, equipped)
  values (v_user, v_item.id, false);

  return jsonb_build_object('ok', true, 'slug', v_item.slug);
end;
$$;

revoke all on function public.purchase_shop_item(text) from public;
grant execute on function public.purchase_shop_item(text) to authenticated;

-- ─── Log de moderación: editores pueden insertar ────────────────────────────
drop policy if exists "Editores insertan log moderación" on public.review_moderation_log;
create policy "Editores insertan log moderación"
  on public.review_moderation_log for insert
  with check (public.is_editor_or_admin());

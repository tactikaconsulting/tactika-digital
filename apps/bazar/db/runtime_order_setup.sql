-- Bazar MVP - activar pedidos reales sin borrar datos.
-- Ejecutar completo en Supabase SQL Editor cuando la app muestre:
-- "Could not find the function public.place_bazar_order(...) in the schema cache".

drop function if exists public.place_bazar_order(jsonb, text, text, text);
drop function if exists public.list_bazar_orders();
drop function if exists public.confirm_bazar_payment(uuid, text, text, text);

create or replace function public.place_bazar_order(
  p_items jsonb,
  p_delivery_method text,
  p_shipping_address text,
  p_payment_provider text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_payment_id uuid;
  v_item jsonb;
  v_product record;
  v_quantity integer;
  v_subtotal integer := 0;
  v_delivery_fee integer := 0;
  v_service_fee integer := 690;
  v_total integer := 0;
  v_premier integer := 0;
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesion para crear un pedido.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El carrito esta vacio.';
  end if;

  insert into public.users (id, name, email, role)
  values (
    v_user_id,
    coalesce(auth.jwt()->'user_metadata'->>'name', split_part(coalesce(auth.jwt()->>'email', 'cliente@bazar.local'), '@', 1)),
    coalesce(auth.jwt()->>'email', 'cliente@bazar.local'),
    case
      when auth.jwt()->'user_metadata'->>'role' in ('cliente', 'comercio', 'admin')
        then (auth.jwt()->'user_metadata'->>'role')::user_role
      else 'cliente'::user_role
    end
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    updated_at = now();

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := greatest(1, coalesce((v_item->>'quantity')::integer, 1));

    select id, merchant_id, price, stock, premier_points, is_active
    into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
    for update;

    if not found or not v_product.is_active then
      raise exception 'Producto no disponible.';
    end if;

    if v_product.stock < v_quantity then
      raise exception 'Stock insuficiente para uno de los productos.';
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_quantity);
    v_premier := v_premier + (greatest(v_product.premier_points, 1) * v_quantity);
  end loop;

  if lower(coalesce(p_delivery_method, '')) = lower('Despacho') and v_subtotal > 0 then
    v_delivery_fee := 1990;
  end if;

  v_total := v_subtotal + v_delivery_fee + v_service_fee;

  insert into public.orders (
    buyer_user_id,
    status,
    subtotal,
    delivery_fee,
    service_fee,
    total,
    premier_points,
    delivery_method,
    shipping_address
  )
  values (
    v_user_id,
    'pendiente_pago',
    v_subtotal,
    v_delivery_fee,
    v_service_fee,
    v_total,
    v_premier,
    coalesce(p_delivery_method, 'Despacho'),
    p_shipping_address
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := greatest(1, coalesce((v_item->>'quantity')::integer, 1));

    select id, merchant_id, price, stock
    into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
    for update;

    insert into public.order_items (
      order_id,
      product_id,
      merchant_id,
      quantity,
      unit_price,
      line_total,
      commission_amount
    )
    values (
      v_order_id,
      v_product.id,
      v_product.merchant_id,
      v_quantity,
      v_product.price,
      v_product.price * v_quantity,
      round((v_product.price * v_quantity) * 0.10)::integer
    );

    update public.products
    set stock = stock - v_quantity,
        updated_at = now()
    where id = v_product.id;
  end loop;

  insert into public.payments (
    order_id,
    provider,
    provider_payment_id,
    status,
    risk,
    amount,
    raw_status,
    confirmed_at
  )
  values (
    v_order_id,
    coalesce(p_payment_provider, 'Pago simulado'),
    'BAZAR-' || v_order_id::text,
    'pendiente',
    case when coalesce(p_payment_provider, '') = 'Transferencia' then 'medio'::risk_level else 'bajo'::risk_level end,
    v_total,
    'checkout_mvp_pendiente',
    null
  )
  returning id into v_payment_id;

  insert into public.payment_events (
    payment_id,
    event_type,
    signature_valid,
    amount_matches,
    reference_unique,
    payload
  )
  values (
    v_payment_id,
    'checkout_mvp_created',
    true,
    true,
    true,
    jsonb_build_object('order_id', v_order_id, 'provider', p_payment_provider)
  );

  return v_order_id;
end;
$$;

create or replace function public.confirm_bazar_payment(
  p_order_id uuid,
  p_payment_status text,
  p_provider_payment_id text default null,
  p_raw_status text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_status payment_status;
  v_order_status order_status;
  v_payment_id uuid;
  v_premier integer;
  v_buyer_user_id uuid;
  v_previous_order_status order_status;
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesion para confirmar el pago.';
  end if;

  select buyer_user_id, premier_points, status
  into v_buyer_user_id, v_premier, v_previous_order_status
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Pedido no encontrado.';
  end if;

  if v_buyer_user_id <> v_user_id and not public.is_admin() then
    raise exception 'No tienes permiso para confirmar este pedido.';
  end if;

  v_status := case lower(coalesce(p_payment_status, ''))
    when 'approved' then 'aprobado'::payment_status
    when 'aprobado' then 'aprobado'::payment_status
    when 'rejected' then 'rechazado'::payment_status
    when 'rechazado' then 'rechazado'::payment_status
    when 'pending' then 'pendiente'::payment_status
    when 'pendiente' then 'pendiente'::payment_status
    else 'revision'::payment_status
  end;

  v_order_status := case v_status
    when 'aprobado' then 'pago_aprobado'::order_status
    when 'rechazado' then 'cancelado'::order_status
    when 'pendiente' then 'pendiente_pago'::order_status
    else 'revision'::order_status
  end;

  select id
  into v_payment_id
  from public.payments
  where order_id = p_order_id
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'Pago no encontrado para el pedido.';
  end if;

  update public.payments
  set status = v_status,
      provider_payment_id = coalesce(nullif(p_provider_payment_id, ''), provider_payment_id),
      risk = case when v_status = 'aprobado' then 'bajo'::risk_level else 'medio'::risk_level end,
      raw_status = coalesce(p_raw_status, raw_status),
      confirmed_at = case when v_status in ('aprobado', 'rechazado') then now() else confirmed_at end
  where id = v_payment_id;

  update public.orders
  set status = v_order_status,
      updated_at = now()
  where id = p_order_id;

  if v_status = 'rechazado' and v_previous_order_status <> 'cancelado' then
    update public.products
    set stock = products.stock + order_items.quantity,
        updated_at = now()
    from public.order_items
    where order_items.product_id = products.id
      and order_items.order_id = p_order_id;
  end if;

  insert into public.payment_events (
    payment_id,
    event_type,
    signature_valid,
    amount_matches,
    reference_unique,
    payload
  )
  values (
    v_payment_id,
    'getnet_status_confirmed',
    true,
    true,
    true,
    jsonb_build_object(
      'order_id', p_order_id,
      'payment_status', v_status,
      'provider_payment_id', p_provider_payment_id,
      'raw_status', p_raw_status
    )
  );

  if v_status = 'aprobado' then
    insert into public.premier_ledger (user_id, order_id, points, reason)
    select v_buyer_user_id, p_order_id, v_premier, 'Compra aprobada en Bazar'
    where not exists (
      select 1
      from public.premier_ledger
      where order_id = p_order_id
        and reason = 'Compra aprobada en Bazar'
    );
  end if;
end;
$$;

create or replace function public.list_bazar_orders()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_admin boolean := public.is_admin();
begin
  if v_user_id is null then
    return '[]'::jsonb;
  end if;

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'order_id', o.id,
        'status', o.status,
        'total', o.total,
        'premier_points', o.premier_points,
        'created_at', o.created_at,
        'payment_provider', p.provider,
        'payment_status', p.status,
        'payment_amount', p.amount,
        'payment_risk', p.risk,
        'items', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'product_id', oi.product_id,
              'product_name', pr.name,
              'merchant_id', oi.merchant_id,
              'merchant_name', m.name,
              'category', pr.category,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'line_total', oi.line_total,
              'commission_amount', oi.commission_amount
            )
            order by oi.created_at asc
          )
          from public.order_items oi
          join public.products pr on pr.id = oi.product_id
          join public.merchants m on m.id = oi.merchant_id
          where oi.order_id = o.id
            and (
              v_is_admin
              or o.buyer_user_id = v_user_id
              or m.owner_user_id = v_user_id
            )
        ), '[]'::jsonb)
      )
      order by o.created_at desc
    )
    from public.orders o
    left join lateral (
      select provider, status, amount, risk
      from public.payments
      where payments.order_id = o.id
      order by payments.created_at desc
      limit 1
    ) p on true
    where
      v_is_admin
      or o.buyer_user_id = v_user_id
      or exists (
        select 1
        from public.order_items oi
        join public.merchants m on m.id = oi.merchant_id
        where oi.order_id = o.id
          and m.owner_user_id = v_user_id
      )
  ), '[]'::jsonb);
end;
$$;

grant execute on function public.place_bazar_order(jsonb, text, text, text) to authenticated;
grant execute on function public.confirm_bazar_payment(uuid, text, text, text) to authenticated;
grant execute on function public.list_bazar_orders() to authenticated;

drop policy if exists "buyers can read own orders" on public.orders;
drop policy if exists "admins can read all orders" on public.orders;
drop policy if exists "buyers can read own order items" on public.order_items;
drop policy if exists "admins can read all order items" on public.order_items;
drop policy if exists "merchants can read own order items" on public.order_items;
drop policy if exists "buyers can read own payments" on public.payments;
drop policy if exists "admins can read all payments" on public.payments;

create policy "buyers can read own orders"
on public.orders for select
using (auth.uid() = buyer_user_id);

create policy "admins can read all orders"
on public.orders for select
using (public.is_admin());

create policy "buyers can read own order items"
on public.order_items for select
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.buyer_user_id = auth.uid()
  )
);

create policy "merchants can read own order items"
on public.order_items for select
using (
  exists (
    select 1
    from public.merchants
    where merchants.id = order_items.merchant_id
      and merchants.owner_user_id = auth.uid()
  )
);

create policy "admins can read all order items"
on public.order_items for select
using (public.is_admin());

create policy "buyers can read own payments"
on public.payments for select
using (
  exists (
    select 1
    from public.orders
    where orders.id = payments.order_id
      and orders.buyer_user_id = auth.uid()
  )
);

create policy "admins can read all payments"
on public.payments for select
using (public.is_admin());

-- Fuerza a Supabase/PostgREST a reconocer las funciones nuevas sin esperar cache.
notify pgrst, 'reload schema';

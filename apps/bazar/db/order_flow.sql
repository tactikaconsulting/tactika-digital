-- Ejecutar en Supabase SQL Editor para activar pedidos reales de Bazar.
-- Crea pedido, lineas, pago simulado aprobado, Premier y descuenta stock en una sola operacion.

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

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El carrito esta vacio.';
  end if;

  insert into public.users (id, name, email, role)
  values (
    v_user_id,
    coalesce(auth.jwt()->'user_metadata'->>'name', split_part(coalesce(auth.jwt()->>'email', 'cliente@bazar.local'), '@', 1)),
    coalesce(auth.jwt()->>'email', 'cliente@bazar.local'),
    coalesce(auth.jwt()->'user_metadata'->>'role', 'cliente')::user_role
  )
  on conflict (id) do nothing;

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
    'pago_aprobado',
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
      round((v_product.price * v_quantity) * 0.10)
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
    'aprobado',
    case when coalesce(p_payment_provider, '') = 'Transferencia' then 'medio'::risk_level else 'bajo'::risk_level end,
    v_total,
    'checkout_mvp_aprobado',
    now()
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
    'checkout_mvp_confirmed',
    true,
    true,
    true,
    jsonb_build_object('order_id', v_order_id, 'provider', p_payment_provider)
  );

  insert into public.premier_ledger (user_id, order_id, points, reason)
  values (v_user_id, v_order_id, v_premier, 'Compra aprobada en Bazar');

  return v_order_id;
end;
$$;

grant execute on function public.place_bazar_order(jsonb, text, text, text) to authenticated;

drop policy if exists "buyers can read own orders" on orders;
drop policy if exists "admins can read all orders" on orders;
drop policy if exists "buyers can read own order items" on order_items;
drop policy if exists "admins can read all order items" on order_items;
drop policy if exists "merchants can read own order items" on order_items;
drop policy if exists "buyers can read own payments" on payments;
drop policy if exists "admins can read all payments" on payments;

create policy "buyers can read own orders"
on orders for select
using (auth.uid() = buyer_user_id);

create policy "admins can read all orders"
on orders for select
using (public.is_admin());

create policy "buyers can read own order items"
on order_items for select
using (
  exists (
    select 1
    from orders
    where orders.id = order_items.order_id
      and orders.buyer_user_id = auth.uid()
  )
);

create policy "merchants can read own order items"
on order_items for select
using (
  exists (
    select 1
    from merchants
    where merchants.id = order_items.merchant_id
      and merchants.owner_user_id = auth.uid()
  )
);

create policy "admins can read all order items"
on order_items for select
using (public.is_admin());

create policy "buyers can read own payments"
on payments for select
using (
  exists (
    select 1
    from orders
    where orders.id = payments.order_id
      and orders.buyer_user_id = auth.uid()
  )
);

create policy "admins can read all payments"
on payments for select
using (public.is_admin());

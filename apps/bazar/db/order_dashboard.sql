-- Ejecutar en Supabase SQL Editor para mostrar pedidos reales en Cliente, Comercio y Admin.

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
          from order_items oi
          join products pr on pr.id = oi.product_id
          join merchants m on m.id = oi.merchant_id
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
    from orders o
    left join lateral (
      select provider, status, amount, risk
      from payments
      where payments.order_id = o.id
      order by payments.created_at desc
      limit 1
    ) p on true
    where
      v_is_admin
      or o.buyer_user_id = v_user_id
      or exists (
        select 1
        from order_items oi
        join merchants m on m.id = oi.merchant_id
        where oi.order_id = o.id
          and m.owner_user_id = v_user_id
      )
  ), '[]'::jsonb);
end;
$$;

grant execute on function public.list_bazar_orders() to authenticated;

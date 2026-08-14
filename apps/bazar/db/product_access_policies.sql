-- Ejecutar en Supabase SQL Editor si los productos no se guardan desde Bazar.
-- Permite que el administrador controle todo y que cada comercio edite solo su tienda/productos.

drop policy if exists "commerce users can manage own merchant profile" on merchants;
drop policy if exists "commerce users can manage own products" on products;

create policy "commerce users can manage own merchant profile"
on merchants for all
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

create policy "commerce users can manage own products"
on products for all
using (
  exists (
    select 1
    from merchants
    where merchants.id = products.merchant_id
      and merchants.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from merchants
    where merchants.id = products.merchant_id
      and merchants.owner_user_id = auth.uid()
  )
);

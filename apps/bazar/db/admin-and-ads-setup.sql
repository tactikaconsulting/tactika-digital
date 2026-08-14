-- 1) Primero crea el usuario en Supabase Auth con correo y clave.
-- 2) Luego cambia este correo por el tuyo y ejecuta este update.
update public.users
set role = 'admin',
    status = 'activo',
    updated_at = now()
where email = 'tu-correo-admin@tactikaconsulting.com';

-- Paquetes iniciales para vender publicidad y alianzas comerciales.
insert into public.ad_packages (name, placement, description, monthly_price, is_active)
values
  (
    'Marca principal',
    'Home + categoria',
    'Presencia superior en portada para marcas, bancos, telcos, seguros o supermercados.',
    250000,
    true
  ),
  (
    'Producto destacado',
    'Listado comprar',
    'Prioridad visual dentro de categorias para comercios que quieren vender mas.',
    49000,
    true
  ),
  (
    'Comercio aliado',
    'Vitrina Premier',
    'Bloque especial para tienda verificada con beneficios exclusivos para clientes.',
    180000,
    true
  )
on conflict do nothing;

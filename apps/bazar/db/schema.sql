create extension if not exists pgcrypto;

create type user_role as enum ('cliente', 'comercio', 'admin');
create type merchant_status as enum ('pendiente_kyc', 'activo', 'suspendido');
create type order_status as enum (
  'pendiente_pago',
  'pago_aprobado',
  'en_preparacion',
  'listo_entrega',
  'entregado',
  'cancelado',
  'revision'
);
create type payment_status as enum ('pendiente', 'aprobado', 'rechazado', 'revision');
create type risk_level as enum ('bajo', 'medio', 'alto');

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role user_role not null default 'cliente',
  status text not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table merchants (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references users(id),
  name text not null,
  legal_name text,
  tax_id text,
  email text not null,
  phone text,
  status merchant_status not null default 'pendiente_kyc',
  commission_rate numeric(5, 4) not null default 0.1000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id),
  name text not null,
  category text not null,
  description text,
  price integer not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  premier_points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  buyer_user_id uuid not null references users(id),
  status order_status not null default 'pendiente_pago',
  subtotal integer not null check (subtotal >= 0),
  delivery_fee integer not null default 0 check (delivery_fee >= 0),
  service_fee integer not null default 0 check (service_fee >= 0),
  total integer not null check (total >= 0),
  premier_points integer not null default 0,
  delivery_method text not null,
  shipping_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  merchant_id uuid not null references merchants(id),
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  line_total integer not null check (line_total >= 0),
  commission_amount integer not null default 0,
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  provider text not null,
  provider_payment_id text unique,
  status payment_status not null default 'pendiente',
  risk risk_level not null default 'medio',
  amount integer not null check (amount >= 0),
  currency text not null default 'CLP',
  raw_status text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create table payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id) on delete cascade,
  event_type text not null,
  signature_valid boolean not null default false,
  amount_matches boolean not null default false,
  reference_unique boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table premier_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  order_id uuid references orders(id),
  points integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index products_merchant_id_idx on products(merchant_id);
create index orders_buyer_user_id_idx on orders(buyer_user_id);
create index order_items_order_id_idx on order_items(order_id);
create index payments_order_id_idx on payments(order_id);
create index payment_events_payment_id_idx on payment_events(payment_id);
create index audit_logs_entity_idx on audit_logs(entity_type, entity_id);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'cliente')::user_role
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    role = excluded.role,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table users enable row level security;
alter table merchants enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table payment_events enable row level security;
alter table premier_ledger enable row level security;
alter table audit_logs enable row level security;

create policy "users can read own profile"
on users for select
using (auth.uid() = id);

create policy "users can update own profile"
on users for update
using (auth.uid() = id);

create policy "public can read active products"
on products for select
using (is_active = true);

create policy "buyers can read own orders"
on orders for select
using (auth.uid() = buyer_user_id);

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

create policy "users can read own premier ledger"
on premier_ledger for select
using (auth.uid() = user_id);

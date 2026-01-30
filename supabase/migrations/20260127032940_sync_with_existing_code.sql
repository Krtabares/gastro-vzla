-- Sincronización de Base de Datos con el código existente (src/lib/db.ts)

-- Eliminar tablas previas en español para evitar confusión
drop table if exists detalles_pedido;
drop table if exists pedidos;
drop table if exists productos;
drop table if exists mesas;
drop table if exists categorias;
drop table if exists perfiles;

-- 1. Tabla de Productos (Interface Product)
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10, 2) not null,
  category text not null,
  available boolean default true,
  stock integer default -1, -- -1 para stock ilimitado
  "minStock" integer default 0,
  created_at timestamptz default now()
);

-- 2. Tabla de Mesas (Interface Table)
create table tables (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  status text not null check (status in ('available', 'occupied', 'billing')),
  "currentOrderId" uuid,
  "currentTotalUsd" numeric(10, 2) default 0,
  "startTime" timestamptz,
  "orderData" text, -- JSON stringificado como espera el código
  created_at timestamptz default now()
);

-- 3. Tabla de Ventas (Interface Sale)
create table sales (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz default now(),
  items jsonb not null, -- Array de OrderItem
  "totalUsd" numeric(10, 2) not null,
  "paymentMethod" text check ("paymentMethod" in ('cash_usd', 'cash_ves', 'zelle', 'pago_movil', 'card')),
  created_at timestamptz default now()
);

-- 4. Tabla de Usuarios (Interface User)
-- Usamos 'users' como pide el db.ts
create table users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password text not null, -- En cloud esto se guarda directo según db.ts:255
  role text not null check (role in ('root', 'admin', 'cashier')),
  name text not null,
  created_at timestamptz default now()
);

-- 5. Tabla de Categorías (Interface Category)
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- 6. Tabla de Ajustes (Settings)
-- El código espera una tabla con key/value (db.ts:102)
create table settings (
  key text primary key,
  value text not null,
  created_at timestamptz default now()
);

-- 7. Tabla de Licencia (db.ts:328)
create table license (
  id uuid primary key default gen_random_uuid(),
  key text,
  "expiryDate" text, -- 'lifetime' o ISO string
  "activationDate" timestamptz,
  created_at timestamptz default now()
);

-- Insertar ajustes por defecto
insert into settings (key, value) values 
  ('exchangeRate', '36.5'),
  ('iva', '0.16'),
  ('igtf', '0.03')
on conflict (key) do nothing;

-- Habilitar RLS en todas las tablas
alter table products enable row level security;
alter table tables enable row level security;
alter table sales enable row level security;
alter table users enable row level security;
alter table categories enable row level security;
alter table settings enable row level security;
alter table license enable row level security;

-- Políticas de acceso total para autenticados (Simplificado para que el cliente lo gestione)
create policy "Acceso total productos" on products for all using (true);
create policy "Acceso total tables" on tables for all using (true);
create policy "Acceso total sales" on sales for all using (true);
create policy "Acceso total users" on users for all using (true);
create policy "Acceso total categories" on categories for all using (true);
create policy "Acceso total settings" on settings for all using (true);
create policy "Acceso total license" on license for all using (true);

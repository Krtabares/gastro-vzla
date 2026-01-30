-- Esquema inicial para Restaurante

-- 1. Categorías de productos
create table categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  descripcion text,
  creado_en timestamptz default now()
);

-- 2. Productos
create table productos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references categorias(id) on delete set null,
  nombre text not null,
  descripcion text,
  precio numeric(10, 2) not null check (precio >= 0),
  disponible boolean default true,
  imagen_url text,
  creado_en timestamptz default now()
);

-- 3. Mesas
create table mesas (
  id uuid primary key default gen_random_uuid(),
  numero integer not null unique,
  capacidad integer default 4,
  estado text default 'libre' check (estado in ('libre', 'ocupada', 'reservada', 'mantenimiento')),
  creado_en timestamptz default now()
);

-- 4. Pedidos (Cabecera)
create table pedidos (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid references mesas(id),
  estado text default 'pendiente' check (estado in ('pendiente', 'en_preparacion', 'servido', 'pagado', 'cancelado')),
  total numeric(10, 2) default 0,
  notas text,
  creado_en timestamptz default now()
);

-- 5. Detalles del Pedido (Items)
create table detalles_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid references pedidos(id) on delete cascade,
  producto_id uuid references productos(id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(10, 2) not null,
  subtotal numeric(10, 2) generated always as (cantidad * precio_unitario) stored,
  creado_en timestamptz default now()
);

-- Habilitar Row Level Security (RLS) para mayor seguridad
alter table categorias enable row level security;
alter table productos enable row level security;
alter table mesas enable row level security;
alter table pedidos enable row level security;
alter table detalles_pedido enable row level security;

-- Crear políticas básicas (Acceso total para usuarios autenticados por ahora)
-- Nota: En producción deberías restringir esto según el rol (admin, mesero, etc.)
create policy "Categorias: Acceso total para autenticados" on categorias for all using (true);
create policy "Productos: Acceso total para autenticados" on productos for all using (true);
create policy "Mesas: Acceso total para autenticados" on mesas for all using (true);
create policy "Pedidos: Acceso total para autenticados" on pedidos for all using (true);
create policy "Detalles: Acceso total para autenticados" on detalles_pedido for all using (true);

-- Gestión de Usuarios y Perfiles (Roles)

-- 1. Crear tabla de perfiles que extiende auth.users de Supabase
create table perfiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  nombre_completo text,
  rol text default 'mesero' check (rol in ('admin', 'mesero', 'cocina', 'cajero')),
  avatar_url text,
  creado_en timestamptz default now(),
  actualizado_en timestamptz default now()
);

-- Habilitar RLS en perfiles
alter table perfiles enable row level security;

-- Políticas de RLS para perfiles
create policy "Perfiles: Los usuarios pueden ver su propio perfil" on perfiles
  for select using (auth.uid() = id);

create policy "Perfiles: Los admins pueden ver todos los perfiles" on perfiles
  for select using (
    exists (
      select 1 from perfiles
      where id = auth.uid() and rol = 'admin'
    )
  );

-- 2. Trigger para crear automáticamente el perfil cuando se registra un usuario en Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfiles (id, email, nombre_completo, rol)
  values (new.id, new.email, new.raw_user_meta_data->>'nombre_completo', coalesce(new.raw_user_meta_data->>'rol', 'mesero'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Actualizar políticas de las tablas creadas anteriormente para usar los roles
-- Primero borramos las políticas genéricas previas
drop policy if exists "Categorias: Acceso total para autenticados" on categorias;
drop policy if exists "Productos: Acceso total para autenticados" on productos;
drop policy if exists "Mesas: Acceso total para autenticados" on mesas;
drop policy if exists "Pedidos: Acceso total para autenticados" on pedidos;
drop policy if exists "Detalles: Acceso total para autenticados" on detalles_pedido;

-- Políticas por Rol (Ejemplos)

-- PRODUCTOS/CATEGORIAS: Todos ven, solo admin edita
create policy "Todos pueden ver productos" on productos for select using (true);
create policy "Solo admin edita productos" on productos for all 
  using (exists (select 1 from perfiles where id = auth.uid() and rol = 'admin'));

create policy "Todos pueden ver categorias" on categorias for select using (true);
create policy "Solo admin edita categorias" on categorias for all 
  using (exists (select 1 from perfiles where id = auth.uid() and rol = 'admin'));

-- MESAS: Todos ven y editan (para cambiar estado)
create policy "Acceso total mesas" on mesas for all using (auth.role() = 'authenticated');

-- PEDIDOS: Todos los autenticados pueden gestionar pedidos
create policy "Gestion de pedidos para personal" on pedidos for all 
  using (auth.role() = 'authenticated');

create policy "Gestion de detalles para personal" on detalles_pedido for all 
  using (auth.role() = 'authenticated');

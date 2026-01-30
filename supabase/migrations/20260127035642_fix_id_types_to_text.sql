-- Fix: Cambiar tipos UUID a TEXT para compatibilidad con IDs generados por el frontend
-- El error 22P02 ocurre porque el frontend envía strings cortos (ej: "1yq0w4zbf") pero la DB espera UUIDs.

-- 1. Eliminar restricciones de llave foránea temporalmente
alter table tables drop constraint if exists tables_currentOrderId_fkey;
alter table sales drop constraint if exists sales_id_fkey;

-- 2. Cambiar tipos de columna a TEXT
alter table products alter column id type text;
alter table products alter column id set default null; -- Quitar default gen_random_uuid

alter table tables alter column id type text;
alter table tables alter column "currentOrderId" type text;

alter table sales alter column id type text;

alter table users alter column id type text;

alter table categories alter column id type text;

alter table settings alter column key type text;

alter table license alter column id type text;

-- 3. Asegurar que las tablas de relación (si las hubiera en el futuro) también usen TEXT
-- (En este proyecto el código parece manejar los IDs como strings arbitrarios)

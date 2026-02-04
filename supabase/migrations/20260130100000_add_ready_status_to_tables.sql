-- Migración para permitir el estado 'ready' en la tabla de mesas
ALTER TABLE tables 
DROP CONSTRAINT IF EXISTS tables_status_check;

ALTER TABLE tables 
ADD CONSTRAINT tables_status_check 
CHECK (status IN ('available', 'occupied', 'billing', 'ready'));

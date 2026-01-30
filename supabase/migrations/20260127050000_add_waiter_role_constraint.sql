-- Actualizar la restricción de rol para incluir 'waiter'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('root', 'admin', 'cashier', 'waiter'));

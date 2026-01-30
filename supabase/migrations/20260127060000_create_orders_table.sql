-- 1. Crear tabla de órdenes
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tableNumber" text NOT NULL,
  items jsonb NOT NULL, -- Array de {name: string, quantity: number}
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cooking', 'ready')),
  "createdAt" timestamptz DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 3. Crear política de acceso total (simplificado para sincronización POS/KDS)
CREATE POLICY "Acceso total orders" ON orders FOR ALL USING (true);

-- 4. Habilitar Realtime para esta tabla
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

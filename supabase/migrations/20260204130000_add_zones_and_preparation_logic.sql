-- Migration to add Multi-zone Preparation Monitors support
-- This migration adds the 'zones' table and 'zoneId' columns to products and orders.

-- 1. Create zones table
CREATE TABLE IF NOT EXISTS zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add zoneId to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS "zoneId" TEXT;

-- 3. Add zoneId to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "zoneId" TEXT;

-- 4. Enable Row Level Security for zones
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

-- 5. Create basic policy for zones (Access for authenticated users)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'zones' AND policyname = 'Acceso total zones'
    ) THEN
        CREATE POLICY "Acceso total zones" ON zones FOR ALL USING (true);
    END IF;
END
$$;

-- 6. Enable Realtime for zones
-- Note: We check if the table is already in the publication to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'zones'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE zones;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add table to publication. Ensure publication exists.';
END
$$;

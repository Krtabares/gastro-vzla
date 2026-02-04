-- Add dispatchedAt and type columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "dispatchedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "type" TEXT DEFAULT 'table';

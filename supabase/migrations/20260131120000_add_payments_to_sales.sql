-- Add payments column to sales table to support multiple payment methods
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payments jsonb;

-- Add status column to sales to support historical data without deletion
ALTER TABLE sales ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';

-- Update existing sales to 'closed' so they don't appear in the new "open" dashboard if they are old
UPDATE sales SET status = 'closed' WHERE timestamp < NOW() - INTERVAL '1 day';

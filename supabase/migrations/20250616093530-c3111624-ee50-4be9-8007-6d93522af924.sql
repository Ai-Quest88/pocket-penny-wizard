
-- Add account_id field to transactions table to link transactions to specific accounts
ALTER TABLE public.transactions 
ADD COLUMN account_id uuid REFERENCES public.assets(id);

-- Create an index for better performance when querying transactions by account
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);

-- Note: This allows linking to assets table. For a more flexible solution, 
-- we could create a separate accounts table that includes both assets and liabilities,
-- but for now this will work for cash accounts (which are assets)

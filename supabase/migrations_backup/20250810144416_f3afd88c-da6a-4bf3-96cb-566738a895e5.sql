
-- Add per-account currency to assets and liabilities
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'AUD';

ALTER TABLE public.liabilities
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'AUD';

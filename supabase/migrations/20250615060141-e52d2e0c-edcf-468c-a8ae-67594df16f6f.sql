
-- Enable RLS on transactions table if not already enabled
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

-- Create comprehensive RLS policies for transactions
CREATE POLICY "Users can view their own transactions" 
  ON public.transactions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
  ON public.transactions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" 
  ON public.transactions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" 
  ON public.transactions 
  FOR DELETE 
  USING (auth.uid() = user_id);

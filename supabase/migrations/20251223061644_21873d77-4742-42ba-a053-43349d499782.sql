-- Add guided appearance config to salons
ALTER TABLE public.salons
ADD COLUMN IF NOT EXISTS appearance jsonb;

-- Helpful index for filtering/searching (optional but cheap)
CREATE INDEX IF NOT EXISTS idx_salons_appearance_gin ON public.salons USING GIN (appearance);

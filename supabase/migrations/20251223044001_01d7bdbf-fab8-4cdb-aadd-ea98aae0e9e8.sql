-- Add slug to salons
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS slug text;

-- Add active flags
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Populate slug for existing salons if missing
UPDATE public.salons
SET slug = lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- If duplicates exist, suffix with short random token
WITH dups AS (
  SELECT slug, array_agg(id) AS ids
  FROM public.salons
  WHERE slug IS NOT NULL
  GROUP BY slug
  HAVING count(*) > 1
)
UPDATE public.salons s
SET slug = s.slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)
FROM dups
WHERE s.slug = dups.slug
  AND s.id <> dups.ids[1];

-- Ensure slug is unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='salons_slug_unique'
  ) THEN
    CREATE UNIQUE INDEX salons_slug_unique ON public.salons (slug);
  END IF;
END $$;

-- Helpful indexes for public page queries
CREATE INDEX IF NOT EXISTS idx_professionals_salon_active ON public.professionals (salon_id, is_active);
CREATE INDEX IF NOT EXISTS idx_services_salon_active ON public.services (salon_id, is_active);

-- updated_at triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_salons_updated_at') THEN
    CREATE TRIGGER update_salons_updated_at
    BEFORE UPDATE ON public.salons
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_professionals_updated_at') THEN
    CREATE TRIGGER update_professionals_updated_at
    BEFORE UPDATE ON public.professionals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_services_updated_at') THEN
    CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
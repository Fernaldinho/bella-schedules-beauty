-- Criar função para retornar dados públicos de salões sem owner_id
CREATE OR REPLACE FUNCTION public.get_public_salon_fields()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  welcome_text text,
  logo_url text,
  logo_format text,
  theme_preset text,
  custom_colors jsonb,
  price_color text,
  service_color text,
  social_media jsonb,
  opening_hours jsonb,
  working_days integer[],
  stats jsonb,
  appearance jsonb,
  slug text,
  whatsapp text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.name,
    s.description,
    s.welcome_text,
    s.logo_url,
    s.logo_format,
    s.theme_preset,
    s.custom_colors,
    s.price_color,
    s.service_color,
    s.social_media,
    s.opening_hours,
    s.working_days,
    s.stats,
    s.appearance,
    s.slug,
    s.whatsapp,
    s.created_at
  FROM public.salons s;
$$;

-- Remover a view antiga e recriar como uma função mais segura
DROP VIEW IF EXISTS public.public_salons;
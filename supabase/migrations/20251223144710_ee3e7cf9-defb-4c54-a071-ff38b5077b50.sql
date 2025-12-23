-- Corrigir a view para usar SECURITY INVOKER (padrão seguro)
DROP VIEW IF EXISTS public.public_salons;

CREATE VIEW public.public_salons 
WITH (security_invoker = true) AS
SELECT 
  id,
  name,
  description,
  welcome_text,
  logo_url,
  logo_format,
  theme_preset,
  custom_colors,
  price_color,
  service_color,
  social_media,
  opening_hours,
  working_days,
  stats,
  appearance,
  slug,
  whatsapp,
  created_at
FROM public.salons;
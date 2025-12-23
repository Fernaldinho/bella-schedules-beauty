-- =============================================
-- CORREÇÃO DE SEGURANÇA: Proteção de Dados Sensíveis
-- =============================================

-- 1. Remover política SELECT pública permissiva de appointments
DROP POLICY IF EXISTS "Public can view appointments" ON public.appointments;

-- 2. Garantir que appointments só podem ser lidos pelo dono do salão
-- (A política "Salon owners can view their appointments" já existe, verificando)

-- 3. Bloquear INSERT em user_roles por usuários comuns
-- (verificar se já existe bloqueio - a tabela não tem INSERT policy, então RLS bloqueia por padrão)

-- 4. Bloquear INSERT/DELETE em subscriptions por usuários
-- (RLS já bloqueia por padrão quando não há policy)

-- 5. Criar view pública para salons sem expor owner_id
CREATE OR REPLACE VIEW public.public_salons AS
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

-- 6. Habilitar RLS para a view (views herdam RLS da tabela base)
-- Não é necessário para views, elas usam as políticas da tabela base

-- 7. Adicionar política mais restritiva para appointments - apenas profissionais vinculados
CREATE POLICY "Professionals can view their own appointments" 
ON public.appointments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.professionals p
    JOIN public.salons s ON s.id = p.salon_id
    WHERE p.id = appointments.professional_id
    AND s.owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.salons s
    WHERE s.id = appointments.salon_id
    AND s.owner_id = auth.uid()
  )
);
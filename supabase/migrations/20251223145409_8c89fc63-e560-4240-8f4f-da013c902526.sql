-- =============================================
-- CORREÇÃO FINAL DE SEGURANÇA
-- =============================================

-- 1. REMOVER política INSERT que permite qualquer autenticado criar appointments
-- (Agendamentos agora são criados APENAS via edge function com service role)
DROP POLICY IF EXISTS "Authenticated users can create appointments" ON public.appointments;

-- 2. REMOVER política UPDATE de subscriptions 
-- (Subscriptions só devem ser modificadas via webhooks do Stripe)
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;

-- 3. Criar política mais restritiva - apenas service role pode inserir
-- Nota: Sem política INSERT, apenas o service role (edge functions) pode inserir
-- A tabela appointments agora não tem política INSERT, então nenhum usuário pode inserir diretamente
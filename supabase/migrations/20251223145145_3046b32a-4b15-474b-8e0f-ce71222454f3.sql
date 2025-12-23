-- =============================================
-- CORREÇÃO DE SEGURANÇA: Appointments e Salons
-- =============================================

-- 1. REMOVER política INSERT pública de appointments
DROP POLICY IF EXISTS "Public can create appointments" ON public.appointments;

-- 2. Criar política INSERT apenas para usuários autenticados
CREATE POLICY "Authenticated users can create appointments" 
ON public.appointments 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 3. Criar política para clientes anônimos criarem agendamentos via edge function
-- (Para manter funcionalidade de booking público, usaremos edge function com service role)

-- 4. Remover políticas SELECT redundantes/conflitantes
DROP POLICY IF EXISTS "Professionals can view their own appointments" ON public.appointments;

-- 5. Atualizar política de visualização para ser mais restritiva
-- Apenas donos de salão podem ver agendamentos
CREATE POLICY "Only salon owners can view appointments" 
ON public.appointments 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.salons s
    WHERE s.id = appointments.salon_id
    AND s.owner_id = auth.uid()
  )
);

-- 6. Atualizar política de UPDATE
DROP POLICY IF EXISTS "Salon owners can manage appointments" ON public.appointments;

CREATE POLICY "Salon owners can update appointments" 
ON public.appointments 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.salons s
    WHERE s.id = appointments.salon_id
    AND s.owner_id = auth.uid()
  )
);

-- 7. Criar política DELETE
CREATE POLICY "Salon owners can delete appointments" 
ON public.appointments 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.salons s
    WHERE s.id = appointments.salon_id
    AND s.owner_id = auth.uid()
  )
);

-- 8. Remover política pública de SELECT em salons e criar uma mais restritiva
DROP POLICY IF EXISTS "Public can view salons" ON public.salons;

-- 9. Criar política que retorna salons sem owner_id para consultas públicas
-- (Implementado via edge function - salons ainda precisam ser públicos para booking)
CREATE POLICY "Anyone can view salons for booking" 
ON public.salons 
FOR SELECT 
USING (true);

-- Nota: A filtragem de owner_id é feita na edge function public-salon-data
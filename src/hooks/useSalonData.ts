import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { slugify } from '@/lib/slugUtils';
import { SalonAppearance } from '@/types/salon';

interface SalonData {
  id: string;
  name: string;
  description: string | null;
  welcomeText: string | null;
  whatsapp: string | null;
  logoUrl: string | null;
  logoFormat: string | null;
  themePreset: string | null;
  customColors: { primary: string; secondary: string; accent: string; primaryForeground?: string } | null;
  priceColor: string | null;
  socialMedia: { instagram: string; whatsapp: string; facebook: string; tiktok: string } | null;
  workingDays: number[] | null;
  openingHours: { start: string; end: string } | null;
  stats: { rating: string; clientCount: string; since: string } | null;
  slug: string | null;
  appearance: SalonAppearance | null;
}

interface UseSalonDataReturn {
  salon: SalonData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateSalon: (data: Partial<SalonData>) => Promise<boolean>;
}

export function useSalonData(): UseSalonDataReturn {
  const [salon, setSalon] = useState<SalonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSalon = useCallback(async () => {
    console.log('[SALON] Iniciando fetch dos dados do salão...');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('[SALON] Sem sessão ativa');
        setIsLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('salons')
        .select('*')
        .eq('owner_id', session.user.id)
        .single();

      if (fetchError) {
        console.error('[SALON] Erro ao buscar salão:', fetchError);
        setError(fetchError.message);
        setIsLoading(false);
        return;
      }

      console.log('[SALON] Dados carregados:', {
        id: data.id,
        name: data.name,
        slug: data.slug,
      });

      const salonData: SalonData = {
        id: data.id,
        name: data.name,
        description: data.description,
        welcomeText: data.welcome_text,
        whatsapp: data.whatsapp,
        logoUrl: data.logo_url,
        logoFormat: data.logo_format,
        themePreset: data.theme_preset,
        customColors: data.custom_colors as SalonData['customColors'],
        priceColor: data.price_color,
        socialMedia: data.social_media as SalonData['socialMedia'],
        workingDays: data.working_days,
        openingHours: data.opening_hours as SalonData['openingHours'],
        stats: data.stats as SalonData['stats'],
        slug: data.slug,
        appearance: (data as any).appearance as SalonAppearance | null,
      };

      setSalon(salonData);
      setError(null);
    } catch (err) {
      console.error('[SALON] Erro inesperado:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSalon = useCallback(async (data: Partial<SalonData>): Promise<boolean> => {
    if (!salon?.id) {
      console.error('[SALON] Sem ID do salão para atualizar');
      return false;
    }

    console.log('[SALON] Salvando atualização...', data);

    // Prepare update object with snake_case keys
    const updateData: Record<string, unknown> = {};
    
    if (data.name !== undefined) {
      updateData.name = data.name;
      updateData.slug = slugify(data.name);
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.welcomeText !== undefined) updateData.welcome_text = data.welcomeText;
    if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp;
    if (data.logoUrl !== undefined) updateData.logo_url = data.logoUrl;
    if (data.logoFormat !== undefined) updateData.logo_format = data.logoFormat;
    if (data.themePreset !== undefined) updateData.theme_preset = data.themePreset;
    if (data.customColors !== undefined) updateData.custom_colors = data.customColors;
    if (data.priceColor !== undefined) updateData.price_color = data.priceColor;
    if (data.socialMedia !== undefined) updateData.social_media = data.socialMedia;
    if (data.workingDays !== undefined) updateData.working_days = data.workingDays;
    if (data.openingHours !== undefined) updateData.opening_hours = data.openingHours;
    if (data.stats !== undefined) updateData.stats = data.stats;
    if (data.appearance !== undefined) updateData.appearance = data.appearance;

    const { error: updateError } = await supabase
      .from('salons')
      .update(updateData)
      .eq('id', salon.id);

    if (updateError) {
      console.error('[SALON] Erro ao salvar:', updateError);
      return false;
    }

    console.log('[SALON] Atualização salva com sucesso');
    
    // Refetch to get fresh data
    await fetchSalon();
    
    return true;
  }, [salon?.id, fetchSalon]);

  // Initial fetch
  useEffect(() => {
    fetchSalon();
  }, [fetchSalon]);

  // Auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      console.log('[SALON] Auth state changed, refetching...');
      fetchSalon();
    });

    return () => subscription.unsubscribe();
  }, [fetchSalon]);

  // Realtime subscription for multi-tab sync
  useEffect(() => {
    if (!salon?.id) return;

    console.log('[REALTIME] Inscrevendo para atualizações do salão:', salon.id);

    const channel = supabase
      .channel(`salon-${salon.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'salons',
          filter: `id=eq.${salon.id}`,
        },
        (payload) => {
          console.log('[REALTIME] Salão atualizado:', payload);
          
          const newData = payload.new as Record<string, unknown>;
          
          setSalon({
            id: newData.id as string,
            name: newData.name as string,
            description: newData.description as string | null,
            welcomeText: newData.welcome_text as string | null,
            whatsapp: newData.whatsapp as string | null,
            logoUrl: newData.logo_url as string | null,
            logoFormat: newData.logo_format as string | null,
            themePreset: newData.theme_preset as string | null,
            customColors: newData.custom_colors as SalonData['customColors'],
            priceColor: newData.price_color as string | null,
            socialMedia: newData.social_media as SalonData['socialMedia'],
            workingDays: newData.working_days as number[] | null,
            openingHours: newData.opening_hours as SalonData['openingHours'],
            stats: newData.stats as SalonData['stats'],
            slug: newData.slug as string | null,
            appearance: newData.appearance as SalonAppearance | null,
          });
        }
      )
      .subscribe();

    return () => {
      console.log('[REALTIME] Removendo inscrição');
      supabase.removeChannel(channel);
    };
  }, [salon?.id]);

  // Window focus refetch (backup for realtime)
  useEffect(() => {
    const handleFocus = () => {
      console.log('[SALON] Janela focada, revalidando dados...');
      fetchSalon();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchSalon]);

  return {
    salon,
    isLoading,
    error,
    refetch: fetchSalon,
    updateSalon,
  };
}

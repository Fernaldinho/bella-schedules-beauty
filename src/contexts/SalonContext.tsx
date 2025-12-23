import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Professional, Service, Appointment, SalonSettings, Client, ThemePreset, CustomColors } from '@/types/salon';
import { professionals as defaultProfessionals, services as defaultServices, sampleAppointments, defaultSalonSettings } from '@/data/salonData';
import { getDayOfWeekFromDateString } from '@/lib/dateUtils';
import { supabase } from '@/integrations/supabase/client';

interface SalonContextType {
  professionals: Professional[];
  services: Service[];
  appointments: Appointment[];
  clients: Client[];
  settings: SalonSettings;
  isLoading: boolean;
  
  // Actions
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => void;
  cancelAppointment: (id: string) => void;
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: string, service: Partial<Service>) => void;
  deleteService: (id: string) => void;
  addProfessional: (professional: Omit<Professional, 'id'>) => void;
  updateProfessional: (id: string, professional: Partial<Professional>) => void;
  deleteProfessional: (id: string) => void;
  updateSettings: (settings: Partial<SalonSettings>) => void;
  getAvailableSlots: (professionalId: string, date: string) => string[];
  isSlotBooked: (professionalId: string, date: string, time: string) => boolean;
  getProfessionalsForService: (serviceId: string) => Professional[];
  refetchData: () => Promise<void>;
}

const SalonContext = createContext<SalonContextType | undefined>(undefined);

export function SalonProvider({ children }: { children: React.ReactNode }) {
  const [professionals, setProfessionals] = useState<Professional[]>(defaultProfessionals);
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [appointments, setAppointments] = useState<Appointment[]>(sampleAppointments);
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<SalonSettings>(defaultSalonSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [salonId, setSalonId] = useState<string | null>(null);

  const applyTheme = (themePreset: ThemePreset, customColors?: CustomColors, priceColor?: string) => {
    const presetThemes: Record<string, { primary: string; primaryForeground: string; secondary: string; accent: string }> = {
      purple: {
        primary: '270 70% 50%',
        primaryForeground: '0 0% 100%',
        secondary: '280 60% 55%',
        accent: '330 80% 60%',
      },
      rose: {
        primary: '350 80% 55%',
        primaryForeground: '0 0% 100%',
        secondary: '340 75% 60%',
        accent: '350 70% 70%',
      },
      gold: {
        primary: '45 90% 40%',
        primaryForeground: '0 0% 100%',
        secondary: '40 85% 50%',
        accent: '50 90% 60%',
      },
    };
    
    // Se for custom e tiver cores definidas, usar elas
    const colors = themePreset === 'custom' && customColors
      ? {
          primary: customColors.primary,
          primaryForeground: customColors.primaryForeground || '0 0% 100%',
          secondary: customColors.secondary,
          accent: customColors.accent,
        }
      : presetThemes[themePreset] || presetThemes.purple;
    
    const root = document.documentElement;
    
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-foreground', colors.primaryForeground);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--secondary', colors.secondary);
    
    if (priceColor) {
      root.style.setProperty('--price-color', priceColor);
    }
    
    // Gradiente dinâmico (2 cores: secondary -> accent)
    const gradientPrimary = `linear-gradient(135deg, hsl(${colors.secondary}) 0%, hsl(${colors.accent}) 100%)`;
    root.style.setProperty('--gradient-primary', gradientPrimary);
    root.style.setProperty('--gradient-hero', gradientPrimary);
    
    // Marcar que o tema foi aplicado (previne flash)
    root.setAttribute('data-theme-loaded', 'true');
    
    console.log('[THEME-ADMIN] Tema aplicado:', { themePreset, colors, priceColor });
  };

  // Fetch all data from Supabase
  const fetchAllData = useCallback(async () => {
    console.log('[CONTEXT] Buscando dados do Supabase...');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('[CONTEXT] Sem sessão, usando dados padrão');
        setIsLoading(false);
        return;
      }

      // Fetch salon
      const { data: salonData, error: salonError } = await supabase
        .from('salons')
        .select('*')
        .eq('owner_id', session.user.id)
        .single();

      if (salonError) {
        console.error('[CONTEXT] Erro ao buscar salão:', salonError);
        setIsLoading(false);
        return;
      }

      setSalonId(salonData.id);
      console.log('[CONTEXT] Salão encontrado:', salonData.id);

      // Update settings from Supabase
      const newSettings: SalonSettings = {
        name: salonData.name || defaultSalonSettings.name,
        description: salonData.description || defaultSalonSettings.description,
        welcomeText: salonData.welcome_text || defaultSalonSettings.welcomeText,
        whatsapp: salonData.whatsapp || defaultSalonSettings.whatsapp,
        coverPhoto: defaultSalonSettings.coverPhoto,
        logoUrl: salonData.logo_url || defaultSalonSettings.logoUrl,
        logoFormat: (salonData.logo_format as SalonSettings['logoFormat']) || defaultSalonSettings.logoFormat,
        themePreset: (salonData.theme_preset as ThemePreset) || defaultSalonSettings.themePreset,
        customColors: (salonData.custom_colors as unknown as CustomColors) || defaultSalonSettings.customColors,
        priceColor: salonData.price_color || defaultSalonSettings.priceColor,
        socialMedia: (salonData.social_media as unknown as SalonSettings['socialMedia']) || defaultSalonSettings.socialMedia,
        openingHours: (salonData.opening_hours as unknown as SalonSettings['openingHours']) || defaultSalonSettings.openingHours,
        workingDays: salonData.working_days || defaultSalonSettings.workingDays,
        stats: (salonData.stats as unknown as SalonSettings['stats']) || defaultSalonSettings.stats,
      };
      
      setSettings(newSettings);
      applyTheme(newSettings.themePreset, newSettings.customColors, newSettings.priceColor);

      // Fetch professionals
      const { data: profData } = await supabase
        .from('professionals')
        .select('*')
        .eq('salon_id', salonData.id)
        .eq('is_active', true);

      if (profData && profData.length > 0) {
        console.log('[CONTEXT] Profissionais carregados:', profData.length);
        const mappedProfs: Professional[] = profData.map(p => ({
          id: p.id,
          name: p.name,
          specialty: p.specialty || '',
          photo: p.photo || '',
          services: [],
          availableDays: p.available_days || [1, 2, 3, 4, 5, 6],
          availableHours: (p.available_hours as { start: string; end: string }) || { start: '09:00', end: '18:00' },
        }));
        setProfessionals(mappedProfs);
      }

      // Fetch services
      const { data: servData } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonData.id)
        .eq('is_active', true);

      if (servData && servData.length > 0) {
        console.log('[CONTEXT] Serviços carregados:', servData.length);
        const mappedServices: Service[] = servData.map(s => ({
          id: s.id,
          name: s.name,
          price: Number(s.price),
          duration: s.duration,
          professionalId: '',
          category: s.category || 'Geral',
        }));
        setServices(mappedServices);
      }

      // Fetch appointments
      const { data: aptData } = await supabase
        .from('appointments')
        .select('*')
        .eq('salon_id', salonData.id);

      if (aptData && aptData.length > 0) {
        console.log('[CONTEXT] Agendamentos carregados:', aptData.length);
        const mappedApts: Appointment[] = aptData.map(a => ({
          id: a.id,
          clientName: a.client_name,
          clientPhone: a.client_phone,
          serviceId: a.service_id || '',
          professionalId: a.professional_id || '',
          date: a.date,
          time: a.time,
          status: a.status as Appointment['status'],
          createdAt: a.created_at,
        }));
        setAppointments(mappedApts);
      }

    } catch (err) {
      console.error('[CONTEXT] Erro ao buscar dados:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Auth state change
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      console.log('[CONTEXT] Auth mudou, recarregando...');
      fetchAllData();
    });

    return () => subscription.unsubscribe();
  }, [fetchAllData]);

  // Realtime subscription for salon updates
  useEffect(() => {
    if (!salonId) return;

    console.log('[CONTEXT-REALTIME] Inscrevendo para salão:', salonId);

    const channel = supabase
      .channel(`salon-context-${salonId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'salons',
          filter: `id=eq.${salonId}`,
        },
        (payload) => {
          console.log('[CONTEXT-REALTIME] Salão atualizado');
          fetchAllData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'professionals',
          filter: `salon_id=eq.${salonId}`,
        },
        () => {
          console.log('[CONTEXT-REALTIME] Profissionais atualizados');
          fetchAllData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services',
          filter: `salon_id=eq.${salonId}`,
        },
        () => {
          console.log('[CONTEXT-REALTIME] Serviços atualizados');
          fetchAllData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `salon_id=eq.${salonId}`,
        },
        () => {
          console.log('[CONTEXT-REALTIME] Agendamentos atualizados');
          fetchAllData();
        }
      )
      .subscribe();

    return () => {
      console.log('[CONTEXT-REALTIME] Removendo inscrição');
      supabase.removeChannel(channel);
    };
  }, [salonId, fetchAllData]);

  // Window focus refetch
  useEffect(() => {
    const handleFocus = () => {
      console.log('[CONTEXT] Janela focada, revalidando...');
      fetchAllData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchAllData]);

  const generateTimeSlots = (start: string, end: string, intervalMinutes: number = 30): string[] => {
    const slots: string[] = [];
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMin = startMin;
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      slots.push(`${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`);
      currentMin += intervalMinutes;
      if (currentMin >= 60) {
        currentHour += 1;
        currentMin -= 60;
      }
    }
    
    return slots;
  };

  const isSlotBooked = (professionalId: string, date: string, time: string): boolean => {
    return appointments.some(
      apt => apt.professionalId === professionalId && 
             apt.date === date && 
             apt.time === time &&
             apt.status !== 'cancelled'
    );
  };

  const getAvailableSlots = (professionalId: string, date: string): string[] => {
    const professional = professionals.find(p => p.id === professionalId);
    if (!professional) return [];
    
    const dayOfWeek = getDayOfWeekFromDateString(date);
    
    if (!settings.workingDays.includes(dayOfWeek)) return [];
    if (!professional.availableDays.includes(dayOfWeek)) return [];
    
    const profStart = professional.availableHours.start;
    const profEnd = professional.availableHours.end;
    const salonStart = settings.openingHours.start;
    const salonEnd = settings.openingHours.end;
    
    const effectiveStart = profStart > salonStart ? profStart : salonStart;
    const effectiveEnd = profEnd < salonEnd ? profEnd : salonEnd;
    
    const allSlots = generateTimeSlots(effectiveStart, effectiveEnd);
    return allSlots;
  };

  const getProfessionalsForService = (serviceId: string): Professional[] => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return [];
    
    return professionals.filter(p => 
      p.services.includes(serviceId) || p.id === service.professionalId
    );
  };

  const addAppointment = (appointment: Omit<Appointment, 'id' | 'createdAt'>) => {
    const newAppointment: Appointment = {
      ...appointment,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setAppointments(prev => [...prev, newAppointment]);

    const existingClient = clients.find(c => c.phone === appointment.clientPhone);
    if (existingClient) {
      setClients(prev => prev.map(c => 
        c.phone === appointment.clientPhone 
          ? { ...c, totalVisits: c.totalVisits + 1, lastVisit: appointment.date, appointments: [...c.appointments, newAppointment] }
          : c
      ));
    } else {
      const newClient: Client = {
        id: Date.now().toString(),
        name: appointment.clientName,
        phone: appointment.clientPhone,
        totalVisits: 1,
        lastVisit: appointment.date,
        appointments: [newAppointment],
      };
      setClients(prev => [...prev, newClient]);
    }
  };

  const cancelAppointment = (id: string) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === id ? { ...apt, status: 'cancelled' } : apt
    ));
  };

  const addService = (service: Omit<Service, 'id'>) => {
    const newService: Service = { ...service, id: Date.now().toString() };
    setServices(prev => [...prev, newService]);
  };

  const updateService = (id: string, serviceData: Partial<Service>) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...serviceData } : s));
  };

  const deleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const addProfessional = (professional: Omit<Professional, 'id'>) => {
    const newProfessional: Professional = { ...professional, id: Date.now().toString() };
    setProfessionals(prev => [...prev, newProfessional]);
  };

  const updateProfessional = (id: string, professionalData: Partial<Professional>) => {
    setProfessionals(prev => prev.map(p => p.id === id ? { ...p, ...professionalData } : p));
  };

  const deleteProfessional = (id: string) => {
    setProfessionals(prev => prev.filter(p => p.id !== id));
  };

  const updateSettings = (newSettings: Partial<SalonSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      applyTheme(updated.themePreset, updated.customColors, updated.priceColor);
      return updated;
    });
  };

  return (
    <SalonContext.Provider value={{
      professionals,
      services,
      appointments,
      clients,
      settings,
      isLoading,
      addAppointment,
      cancelAppointment,
      addService,
      updateService,
      deleteService,
      addProfessional,
      updateProfessional,
      deleteProfessional,
      updateSettings,
      getAvailableSlots,
      isSlotBooked,
      getProfessionalsForService,
      refetchData: fetchAllData,
    }}>
      {children}
    </SalonContext.Provider>
  );
}

export function useSalon() {
  const context = useContext(SalonContext);
  if (context === undefined) {
    throw new Error('useSalon must be used within a SalonProvider');
  }
  return context;
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Professional, Service, Appointment, SalonSettings, Subscription, Client, ThemePreset, CustomColors } from '@/types/salon';
import { professionals as defaultProfessionals, services as defaultServices, sampleAppointments, defaultSalonSettings } from '@/data/salonData';
import { getDayOfWeekFromDateString } from '@/lib/dateUtils';

interface SalonContextType {
  professionals: Professional[];
  services: Service[];
  appointments: Appointment[];
  clients: Client[];
  settings: SalonSettings;
  subscription: Subscription;
  
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
  activateSubscription: () => void;
  getAvailableSlots: (professionalId: string, date: string) => string[];
  isSlotBooked: (professionalId: string, date: string, time: string) => boolean;
  getProfessionalsForService: (serviceId: string) => Professional[];
}

const SalonContext = createContext<SalonContextType | undefined>(undefined);

export function SalonProvider({ children }: { children: React.ReactNode }) {
  const [professionals, setProfessionals] = useState<Professional[]>(defaultProfessionals);
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [appointments, setAppointments] = useState<Appointment[]>(sampleAppointments);
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<SalonSettings>(defaultSalonSettings);
  const [subscription, setSubscription] = useState<Subscription>({
    isActive: false,
    plan: null,
    price: 45.30,
    expiresAt: null,
  });

  const applyTheme = (themePreset: ThemePreset, customColors?: CustomColors, priceColor?: string) => {
    const presetThemes = {
      purple: {
        primary: '270 70% 50%',
        secondary: '320 70% 60%',
        accent: '330 80% 60%',
      },
      rose: {
        primary: '350 80% 55%',
        secondary: '340 70% 65%',
        accent: '350 70% 70%',
      },
      gold: {
        primary: '45 90% 40%',
        secondary: '40 85% 50%',
        accent: '45 90% 55%',
      },
      custom: customColors || {
        primary: '280 60% 50%',
        secondary: '320 70% 60%',
        accent: '340 80% 65%',
      },
    };
    
    const colors = presetThemes[themePreset];
    
    document.documentElement.style.setProperty('--primary', colors.primary);
    document.documentElement.style.setProperty('--primary-foreground', '0 0% 100%');
    document.documentElement.style.setProperty('--accent', colors.accent);
    
    // Apply price color
    if (priceColor) {
      document.documentElement.style.setProperty('--price-color', priceColor);
    }
    
    // Update gradient
    const gradientPrimary = `linear-gradient(135deg, hsl(${colors.primary}) 0%, hsl(${colors.secondary}) 50%, hsl(${colors.accent}) 100%)`;
    document.documentElement.style.setProperty('--gradient-primary', gradientPrimary);
  };

  // Load from localStorage
  useEffect(() => {
    const savedSubscription = localStorage.getItem('salon_subscription');
    if (savedSubscription) {
      setSubscription(JSON.parse(savedSubscription));
    }
    
    const savedAppointments = localStorage.getItem('salon_appointments');
    if (savedAppointments) {
      setAppointments(JSON.parse(savedAppointments));
    }

    const savedSettings = localStorage.getItem('salon_settings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      // Merge with defaults to ensure all new fields exist
      const mergedSettings = { ...defaultSalonSettings, ...parsedSettings };
      setSettings(mergedSettings);
      applyTheme(mergedSettings.themePreset, mergedSettings.customColors, mergedSettings.priceColor);
    }

    const savedProfessionals = localStorage.getItem('salon_professionals');
    if (savedProfessionals) {
      setProfessionals(JSON.parse(savedProfessionals));
    }

    const savedServices = localStorage.getItem('salon_services');
    if (savedServices) {
      setServices(JSON.parse(savedServices));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('salon_subscription', JSON.stringify(subscription));
  }, [subscription]);

  useEffect(() => {
    localStorage.setItem('salon_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('salon_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('salon_professionals', JSON.stringify(professionals));
  }, [professionals]);

  useEffect(() => {
    localStorage.setItem('salon_services', JSON.stringify(services));
  }, [services]);

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
    
    // Check if day is a working day for the salon
    if (!settings.workingDays.includes(dayOfWeek)) return [];
    
    // Check if professional works on this day
    if (!professional.availableDays.includes(dayOfWeek)) return [];
    
    // Get professional's hours but constrain to salon opening hours
    const profStart = professional.availableHours.start;
    const profEnd = professional.availableHours.end;
    const salonStart = settings.openingHours.start;
    const salonEnd = settings.openingHours.end;
    
    // Use the later start time and earlier end time
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

    // Update or create client
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

  const activateSubscription = () => {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    setSubscription({
      isActive: true,
      plan: 'pro',
      price: 45.30,
      expiresAt: expiresAt.toISOString(),
    });
  };

  return (
    <SalonContext.Provider value={{
      professionals,
      services,
      appointments,
      clients,
      settings,
      subscription,
      addAppointment,
      cancelAppointment,
      addService,
      updateService,
      deleteService,
      addProfessional,
      updateProfessional,
      deleteProfessional,
      updateSettings,
      activateSubscription,
      getAvailableSlots,
      isSlotBooked,
      getProfessionalsForService,
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

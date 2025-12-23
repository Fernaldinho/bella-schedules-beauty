import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Home,
  ArrowLeft,
  Sparkles, 
  Star, 
  Clock,
  Check,
  Loader2,
  Instagram,
  MessageCircle
} from 'lucide-react';
import { format, addDays, parse, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type BookingStep = 'landing' | 'professional' | 'service' | 'date' | 'time' | 'form' | 'success';

interface SalonData {
  id: string;
  name: string;
  description: string;
  welcome_text: string;
  logo_url: string;
  logo_format: string;
  theme_preset: string;
  custom_colors: { primary: string; primaryForeground?: string; secondary: string; accent: string };
  price_color: string;
  service_color: string;
  social_media: { instagram: string; whatsapp: string };
  opening_hours: { start: string; end: string };
  working_days: number[];
  stats: { rating: string; clientCount: string; since: string };
  whatsapp: string;
}

interface Professional {
  id: string;
  name: string;
  specialty: string;
  photo: string;
  available_days: number[];
  available_hours: { start: string; end: string };
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
}

export default function ClientBooking() {
  const { salonId, slug, professionalId: preselectedProfessionalId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<BookingStep>('landing');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [salon, setSalon] = useState<SalonData | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionalServices, setProfessionalServices] = useState<{ professional_id: string; service_id: string }[]>([]);
  const [isSalonActive, setIsSalonActive] = useState(false);
  const [isProfessionalLocked, setIsProfessionalLocked] = useState(false);
  
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  useEffect(() => {
    if (salonId || slug) {
      loadSalonData();
    }
  }, [salonId, slug]);

  // Window focus revalidation (multi-tab safe)
  useEffect(() => {
    const onFocus = () => {
      console.log('[PUBLIC] Janela focada, revalidando dados...');
      loadSalonData();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [salonId, slug]);

  // Realtime (best-effort): refresh public data when salon/services/professionals update
  useEffect(() => {
    if (!salon?.id) return;

    console.log('[PUBLIC-REALTIME] Inscrevendo para atualizações do salão:', salon.id);

    const channel = supabase
      .channel(`public-salon-${salon.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'salons', filter: `id=eq.${salon.id}` },
        () => {
          console.log('[PUBLIC-REALTIME] Salão atualizado (revalidando)');
          loadSalonData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'services', filter: `salon_id=eq.${salon.id}` },
        () => {
          console.log('[PUBLIC-REALTIME] Serviços atualizados (revalidando)');
          loadSalonData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'professionals', filter: `salon_id=eq.${salon.id}` },
        () => {
          console.log('[PUBLIC-REALTIME] Profissionais atualizados (revalidando)');
          loadSalonData();
        }
      )
      .subscribe();

    return () => {
      console.log('[PUBLIC-REALTIME] Removendo inscrição');
      supabase.removeChannel(channel);
    };
  }, [salon?.id]);

  useEffect(() => {
    if (salon) {
      applyTheme(salon);
    }
  }, [salon]);

  useEffect(() => {
    if (selectedProfessional && selectedDate && salon) {
      loadBookedSlots();
    }
  }, [selectedProfessional, selectedDate, salon]);

  const applyTheme = (salonData: SalonData) => {
    // Buscar cores do tema preset ou personalizadas
    const colors = getThemeColors(salonData);
    
    console.log('[THEME] Aplicando tema:', {
      preset: salonData.theme_preset,
      colors,
      priceColor: salonData.price_color,
      serviceColor: salonData.service_color
    });
    
    // Aplicar cores CSS diretamente no :root
    const root = document.documentElement;
    
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-foreground', colors.primaryForeground);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--secondary', colors.secondary);
    
    // Gradientes dinâmicos (sempre 2 cores: secondary -> accent)
    const gradient = `linear-gradient(135deg, hsl(${colors.secondary}) 0%, hsl(${colors.accent}) 100%)`;
    root.style.setProperty('--gradient-primary', gradient);
    root.style.setProperty('--gradient-hero', gradient);
    
    // Cores de preço e serviço (se configuradas)
    if (salonData.price_color) {
      root.style.setProperty('--price-color', salonData.price_color);
    }
    if (salonData.service_color) {
      root.style.setProperty('--service-color', salonData.service_color);
    }
    
    // Marcar que o tema foi aplicado (previne flash)
    root.setAttribute('data-theme-loaded', 'true');
  };

  // Função para obter cores baseadas no preset ou customização
  const getThemeColors = (salonData: SalonData) => {
    const preset = salonData.theme_preset || 'purple';
    const customColors = salonData.custom_colors;
    
    // Presets fixos com primaryForeground
    const presets: Record<string, { primary: string; primaryForeground: string; secondary: string; accent: string }> = {
      purple: { primary: '270 70% 50%', primaryForeground: '0 0% 100%', secondary: '280 60% 55%', accent: '330 80% 60%' },
      rose: { primary: '350 80% 55%', primaryForeground: '0 0% 100%', secondary: '340 75% 60%', accent: '350 70% 70%' },
      gold: { primary: '45 90% 40%', primaryForeground: '0 0% 100%', secondary: '40 85% 50%', accent: '50 90% 60%' },
    };
    
    // Se for custom e tiver cores definidas, usar elas
    if (preset === 'custom' && customColors) {
      return {
        primary: customColors.primary || '270 70% 50%',
        primaryForeground: customColors.primaryForeground || '0 0% 100%',
        secondary: customColors.secondary || '320 70% 60%',
        accent: customColors.accent || '330 80% 60%',
      };
    }
    
    // Caso contrário, usar preset (ou purple como fallback)
    return presets[preset] || presets.purple;
  };

  const loadSalonData = async () => {
    setIsLoading(true);

    const reqSlug = (slug || '').trim();
    const reqSalonId = (salonId || '').trim();

    console.log('[ClientBooking] loading public salon data', { slug: reqSlug, salonId: reqSalonId });

    try {
      const { data, error } = await supabase.functions.invoke('public-salon-data', {
        body: {
          slug: reqSlug || undefined,
          salonId: reqSalonId || undefined,
        },
      });

      if (error) throw error;

      const loadedSalon = (data?.salon || null) as SalonData | null;
      const loadedProfessionals = ((data?.professionals || []) as unknown as Professional[]);
      const loadedServices = ((data?.services || []) as unknown as Service[]);
      const loadedProfessionalServices = (data?.professionalServices || []) as { professional_id: string; service_id: string }[];

      console.log('[ClientBooking] loaded', {
        salonFound: !!loadedSalon,
        professionals: loadedProfessionals.length,
        services: loadedServices.length,
        subscriptionActive: !!data?.subscription?.isActive,
      });

      setSalon(loadedSalon);
      setProfessionals(loadedProfessionals);
      setServices(loadedServices);
      setProfessionalServices(loadedProfessionalServices);

      const configured = loadedProfessionals.length > 0 && loadedServices.length > 0;
      const active = !!data?.subscription?.isActive && configured;
      setIsSalonActive(active);

      // If professional is pre-selected via URL, find and select them
      if (preselectedProfessionalId && loadedProfessionals.length > 0) {
        const preselected = loadedProfessionals.find(p => p.id === preselectedProfessionalId);
        if (preselected) {
          setSelectedProfessional(preselected);
          setIsProfessionalLocked(true);
          // Skip to service selection on landing click
        }
      }

      if (loadedSalon?.name) {
        document.title = `${loadedSalon.name} | Agendamento Online`;
      }
    } catch (error) {
      console.error('Error loading salon:', error);
      toast({ title: 'Erro ao carregar dados do salão', variant: 'destructive' });
      setSalon(null);
      setProfessionals([]);
      setServices([]);
      setProfessionalServices([]);
      setIsSalonActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookedSlots = async () => {
    if (!selectedProfessional || !selectedDate || !salon) return;
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { data } = await supabase
      .from('appointments')
      .select('time')
      .eq('salon_id', salon.id)
      .eq('professional_id', selectedProfessional.id)
      .eq('date', dateStr)
      .neq('status', 'cancelled');
    
    setBookedSlots((data || []).map(a => a.time));
  };

  const getServicesForProfessional = (profId: string): Service[] => {
    const serviceIds = professionalServices
      .filter(ps => ps.professional_id === profId)
      .map(ps => ps.service_id);
    return services.filter(s => serviceIds.includes(s.id));
  };

  const generateTimeSlots = (): string[] => {
    if (!selectedProfessional || !salon) return [];
    
    const profHours = selectedProfessional.available_hours || { start: '09:00', end: '18:00' };
    const salonHours = salon.opening_hours || { start: '09:00', end: '18:00' };
    
    const start = profHours.start > salonHours.start ? profHours.start : salonHours.start;
    const end = profHours.end < salonHours.end ? profHours.end : salonHours.end;
    
    const slots: string[] = [];
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    let h = startH, m = startM;
    while (h < endH || (h === endH && m < endM)) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      m += 30;
      if (m >= 60) { h++; m = 0; }
    }
    return slots;
  };

  const isDateDisabled = (date: Date): boolean => {
    if (!salon || !selectedProfessional) return true;
    
    const today = startOfDay(new Date());
    if (isBefore(date, today)) return true;
    
    const dayOfWeek = date.getDay();
    if (!salon.working_days?.includes(dayOfWeek)) return true;
    if (!selectedProfessional.available_days?.includes(dayOfWeek)) return true;
    
    return false;
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  const formatDuration = (mins: number) => mins < 60 ? `${mins}min` : `${Math.floor(mins/60)}h${mins%60 > 0 ? ` ${mins%60}min` : ''}`;
  const formatDateBR = (date: Date) => format(date, "dd/MM/yyyy", { locale: ptBR });

  const handleWhatsAppRedirect = () => {
    if (!salon || !selectedProfessional || !selectedService || !selectedDate || !selectedTime) return;
    
    const whatsappNumber = salon.whatsapp || salon.social_media?.whatsapp || '';
    if (!whatsappNumber) {
      console.log('[WHATSAPP] Número não configurado');
      return;
    }
    
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    const fullNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
    
    const message = encodeURIComponent(
      `✨ *Agendamento Confirmado - ${salon.name}*\n\n` +
      `👤 Cliente: ${clientName}\n` +
      `💇 Serviço: ${selectedService.name}\n` +
      `👩 Profissional: ${selectedProfessional.name}\n` +
      `📅 Data: ${formatDateBR(selectedDate)}\n` +
      `🕐 Horário: ${selectedTime}\n` +
      `💰 Valor: ${formatPrice(selectedService.price)}\n\n` +
      `Obrigado por agendar conosco! 💖`
    );
    
    const whatsappUrl = `https://wa.me/${fullNumber}?text=${message}`;
    console.log('[WHATSAPP] Redirecionando para:', whatsappUrl);
    
    window.open(whatsappUrl, '_blank');
  };

  const handleSubmit = async () => {
    if (!selectedProfessional || !selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone || !salon) return;
    
    setIsSubmitting(true);
    try {
      // Usar edge function segura para criar agendamento
      const { data, error } = await supabase.functions.invoke('create-appointment', {
        body: {
          salonId: salon.id,
          professionalId: selectedProfessional.id,
          serviceId: selectedService.id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime,
          clientName: clientName.trim(),
          clientPhone: clientPhone.replace(/\D/g, ''),
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      setStep('success');
    } catch (error) {
      console.error('Error booking:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao agendar';
      toast({ title: errorMessage, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'professional': setStep('landing'); break;
      case 'service': 
        if (isProfessionalLocked) {
          setStep('landing');
        } else {
          setStep('professional'); 
          setSelectedProfessional(null); 
        }
        break;
      case 'date': setStep('service'); setSelectedService(null); break;
      case 'time': setStep('date'); setSelectedDate(undefined); break;
      case 'form': setStep('time'); setSelectedTime(null); break;
    }
  };

  const resetBooking = () => {
    setStep('landing');
    if (!isProfessionalLocked) {
      setSelectedProfessional(null);
    }
    setSelectedService(null);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setClientName('');
    setClientPhone('');
  };

  const handleStartBooking = () => {
    if (isProfessionalLocked && selectedProfessional) {
      setStep('service');
    } else {
      setStep('professional');
    }
  };

  // Loading: não renderiza nada visual até ter os dados (evita flash de cores default)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Salão não encontrado</p>
      </div>
    );
  }

  // Header for booking steps
  const BookingHeader = () => (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center gap-4">
        {step !== 'success' && step !== 'landing' && (
          <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        {step !== 'landing' && (
          <Button variant="ghost" size="icon" onClick={resetBooking} className="rounded-full">
            <Home className="w-5 h-5" />
          </Button>
        )}
        <div className="flex-1 flex items-center gap-3">
          {salon.logo_url && (
            <img
              src={salon.logo_url}
              alt={salon.name}
              className={cn(
                'h-8 object-contain',
                salon.logo_format === 'circular' && 'rounded-full',
                salon.logo_format === 'square' && 'rounded-lg'
              )}
            />
          )}
          <div>
            <h1 className="font-display font-semibold text-foreground">{salon.name}</h1>
            <p className="text-xs text-muted-foreground">Agendamento Online</p>
          </div>
        </div>
      </div>
    </header>
  );

  // Success Step
  if (step === 'success') {
    const hasWhatsApp = !!(salon.whatsapp || salon.social_media?.whatsapp);
    
    return (
      <div className="min-h-screen bg-background">
        <BookingHeader />
        <main className="container mx-auto px-4 py-8 max-w-lg">
          <div className="text-center animate-scale-in">
            <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-2">Agendamento Confirmado!</h2>
            <p className="text-muted-foreground mb-6">Seu horário foi reservado com sucesso.</p>
            
            <Card className="p-6 text-left mb-6 border-0 shadow-card">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profissional</span>
                  <span className="font-medium">{selectedProfessional?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serviço</span>
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data</span>
                  <span className="font-medium">{selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horário</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-semibold text-primary">{selectedService && formatPrice(selectedService.price)}</span>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              {hasWhatsApp && (
                <Button variant="hero" size="lg" onClick={handleWhatsAppRedirect} className="gap-2 w-full">
                  <MessageCircle className="w-5 h-5" />
                  Confirmar via WhatsApp
                </Button>
              )}
              
              <Button variant={hasWhatsApp ? "secondary" : "gradient"} size="lg" onClick={resetBooking} className="gap-2 w-full">
                <Home className="w-4 h-4" />
                Fazer Novo Agendamento
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Landing
  if (step === 'landing') {
    const canBook = isSalonActive;
    
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center gap-3">
            {salon.logo_url && (
              <img
                src={salon.logo_url}
                alt={salon.name}
                className={cn(
                  'h-10 object-contain',
                  salon.logo_format === 'circular' && 'rounded-full',
                  salon.logo_format === 'square' && 'rounded-lg'
                )}
              />
            )}
            <span className="font-display font-semibold text-lg text-foreground">{salon.name}</span>
          </div>
        </header>

        <section className="relative pt-12 pb-20 overflow-hidden">
          <div className="absolute inset-0 gradient-soft" />
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Seu momento de beleza</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                {salon.welcome_text || `Agende seu momento de beleza no ${salon.name} 💖`}
              </h1>
              
              <p className="text-muted-foreground mb-8">{salon.description}</p>
              
              {canBook ? (
                <div className="space-y-4">
                  {isProfessionalLocked && selectedProfessional && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent">
                      <span className="text-sm font-medium">Agendando com {selectedProfessional.name}</span>
                    </div>
                  )}
                  <div>
                    <Button variant="hero" size="xl" onClick={handleStartBooking} className="group">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Agendar Agora
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-muted/50 border border-border">
                  <p className="text-muted-foreground mb-2">
                    Este salão ainda está configurando seus serviços.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Em breve você poderá agendar online!
                  </p>
                </div>
              )}

              {(salon.social_media?.instagram || salon.social_media?.whatsapp) && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  {salon.social_media?.instagram && (
                    <a href={`https://instagram.com/${salon.social_media.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <Instagram className="w-4 h-4" />
                      @{salon.social_media.instagram.replace('@', '')}
                    </a>
                  )}
                  {salon.social_media?.whatsapp && (
                    <a href={`https://wa.me/${salon.social_media.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </a>
                  )}
                </div>
              )}

              <div className="flex items-center justify-center gap-6 mt-6 flex-wrap">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span>{salon.stats?.rating || '4.9'} estrelas</span>
                </div>
                <div className="text-sm text-muted-foreground">{salon.stats?.clientCount || '+500'} clientes</div>
                <div className="text-sm text-muted-foreground">Desde {salon.stats?.since || '2020'}</div>
              </div>
            </div>
          </div>
        </section>

        {professionals.length > 0 && (
          <section className="py-12 bg-card">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-display font-semibold text-foreground text-center mb-8">Nossa Equipe</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {professionals.map((prof) => (
                  <Card key={prof.id} className="p-4 text-center border-0 shadow-card">
                    {prof.photo ? (
                      <img src={prof.photo} alt={prof.name} className="w-16 h-16 rounded-full mx-auto mb-3 object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full mx-auto mb-3 gradient-primary flex items-center justify-center text-white font-semibold text-xl">
                        {prof.name[0]}
                      </div>
                    )}
                    <h3 className="font-medium text-foreground">{prof.name}</h3>
                    <p className="text-sm text-muted-foreground">{prof.specialty}</p>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    );
  }

  // Professional Selection
  if (step === 'professional') {
    return (
      <div className="min-h-screen bg-background">
        <BookingHeader />
        <main className="container mx-auto px-4 py-8 max-w-lg">
          <div className="text-center mb-8">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
            <h2 className="text-2xl font-display font-semibold text-foreground">Escolha o Profissional</h2>
            <p className="text-muted-foreground mt-2">Selecione quem vai te atender</p>
          </div>
          
          {professionals.length === 0 ? (
            <div className="text-center p-8 rounded-2xl bg-muted/50 border border-border">
              <p className="text-muted-foreground">Nenhum profissional disponível no momento.</p>
              <Button variant="outline" className="mt-4" onClick={resetBooking}>
                Voltar
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {professionals.map((prof, i) => (
                <Card
                  key={prof.id}
                  onClick={() => { setSelectedProfessional(prof); setStep('service'); }}
                  className="p-4 cursor-pointer transition-all duration-300 hover:shadow-card hover:border-primary/30 border-2 border-transparent animate-fade-in"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    {prof.photo ? (
                      <img src={prof.photo} alt={prof.name} className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-white font-semibold text-xl">
                        {prof.name[0]}
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-foreground">{prof.name}</h3>
                      <p className="text-sm text-muted-foreground">{prof.specialty}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getServicesForProfessional(prof.id).length} serviços disponíveis
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // Service Selection
  if (step === 'service') {
    const availableServices = getServicesForProfessional(selectedProfessional?.id || '');
    const grouped = availableServices.reduce((acc, s) => {
      if (!acc[s.category || 'Geral']) acc[s.category || 'Geral'] = [];
      acc[s.category || 'Geral'].push(s);
      return acc;
    }, {} as Record<string, Service[]>);

    return (
      <div className="min-h-screen bg-background">
        <BookingHeader />
        <main className="container mx-auto px-4 py-8 max-w-lg">
          <div className="text-center mb-8">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
            <h2 className="text-2xl font-display font-semibold text-foreground">Escolha o Serviço</h2>
            <p className="text-muted-foreground mt-2">Com {selectedProfessional?.name}</p>
          </div>
          {Object.entries(grouped).map(([cat, svcs]) => (
            <div key={cat} className="mb-6">
              <h3 className="text-lg font-display font-medium text-foreground mb-3 px-1">{cat}</h3>
              <div className="space-y-3">
                {svcs.map((svc, i) => (
                  <Card
                    key={svc.id}
                    onClick={() => { setSelectedService(svc); setStep('date'); }}
                    className="p-4 cursor-pointer transition-all duration-300 hover:shadow-card hover:border-primary/30 border-2 border-transparent animate-fade-in"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">{svc.name}</h4>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {formatDuration(svc.duration)}
                        </div>
                      </div>
                      <span 
                        className="text-lg font-semibold"
                        style={{ color: salon.price_color ? `hsl(${salon.price_color})` : undefined }}
                      >
                        {formatPrice(svc.price)}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </main>
      </div>
    );
  }

  // Date Selection
  if (step === 'date') {
    return (
      <div className="min-h-screen bg-background">
        <BookingHeader />
        <main className="container mx-auto px-4 py-8 max-w-lg">
          <div className="text-center mb-8">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
            <h2 className="text-2xl font-display font-semibold text-foreground">Escolha a Data</h2>
            <p className="text-muted-foreground mt-2">{selectedService?.name} com {selectedProfessional?.name}</p>
          </div>
          <Card className="p-4 border-0 shadow-card flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => { if (date) { setSelectedDate(date); setStep('time'); } }}
              disabled={isDateDisabled}
              locale={ptBR}
              className="pointer-events-auto"
              fromDate={new Date()}
              toDate={addDays(new Date(), 60)}
            />
          </Card>
        </main>
      </div>
    );
  }

  // Time Selection
  if (step === 'time') {
    const slots = generateTimeSlots();
    const morning = slots.filter(s => parseInt(s.split(':')[0]) < 12);
    const afternoon = slots.filter(s => parseInt(s.split(':')[0]) >= 12);

    return (
      <div className="min-h-screen bg-background">
        <BookingHeader />
        <main className="container mx-auto px-4 py-8 max-w-lg">
          <div className="text-center mb-8">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
            <h2 className="text-2xl font-display font-semibold text-foreground">Escolha o Horário</h2>
            <p className="text-muted-foreground mt-2">{selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</p>
          </div>
          
          {morning.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Manhã</h3>
              <div className="grid grid-cols-4 gap-2">
                {morning.map((time) => {
                  const booked = bookedSlots.includes(time);
                  return (
                    <Button
                      key={time}
                      variant={selectedTime === time ? 'gradient' : 'outline'}
                      disabled={booked}
                      onClick={() => { setSelectedTime(time); setStep('form'); }}
                      className={cn(booked && 'opacity-50 line-through')}
                    >
                      {time}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {afternoon.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Tarde</h3>
              <div className="grid grid-cols-4 gap-2">
                {afternoon.map((time) => {
                  const booked = bookedSlots.includes(time);
                  return (
                    <Button
                      key={time}
                      variant={selectedTime === time ? 'gradient' : 'outline'}
                      disabled={booked}
                      onClick={() => { setSelectedTime(time); setStep('form'); }}
                      className={cn(booked && 'opacity-50 line-through')}
                    >
                      {time}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mt-6 text-xs text-muted-foreground justify-center">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded border border-border" />Disponível</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-muted opacity-50" />Ocupado</div>
          </div>
        </main>
      </div>
    );
  }

  // Form
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-background">
        <BookingHeader />
        <main className="container mx-auto px-4 py-8 max-w-lg">
          <div className="text-center mb-8">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
            <h2 className="text-2xl font-display font-semibold text-foreground">Seus Dados</h2>
            <p className="text-muted-foreground mt-2">Preencha para confirmar o agendamento</p>
          </div>

          <Card className="p-6 border-0 shadow-card mb-6">
            <div className="space-y-4 text-sm mb-6">
              <div className="flex justify-between"><span className="text-muted-foreground">Profissional</span><span className="font-medium">{selectedProfessional?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Serviço</span><span className="font-medium">{selectedService?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Data</span><span className="font-medium">{selectedDate && format(selectedDate, "dd/MM/yyyy")}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Horário</span><span className="font-medium">{selectedTime}</span></div>
              <div className="flex justify-between border-t pt-4"><span className="text-muted-foreground">Valor</span><span className="font-semibold text-primary">{selectedService && formatPrice(selectedService.price)}</span></div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Seu nome" className="input-elegant" />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="(00) 00000-0000" className="input-elegant" />
              </div>
            </div>
          </Card>

          <Button
            variant="hero"
            size="xl"
            className="w-full"
            disabled={!clientName || !clientPhone || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Agendamento'}
          </Button>
        </main>
      </div>
    );
  }

  return null;
}

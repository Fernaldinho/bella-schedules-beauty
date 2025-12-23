import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AppointmentCard } from '@/components/professional/AppointmentCard';
import { RevenueFilter, RevenuePeriod } from '@/components/professional/RevenueFilter';
import { 
  Calendar,
  Clock,
  DollarSign,
  Loader2,
  TrendingUp,
  Scissors,
  Settings,
  Link,
  Check,
  Upload,
  X,
  Save,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SalonData {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  logo_format: string | null;
  theme_preset: string | null;
  custom_colors: { primary: string; primaryForeground?: string; secondary: string; accent: string } | null;
}

interface Professional {
  id: string;
  name: string;
  specialty: string | null;
  photo: string | null;
  available_days: number[];
  available_hours: { start: string; end: string };
  salon_id: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  client_name: string;
  service: Service | null;
}

interface ServiceStats {
  name: string;
  count: number;
  revenue: number;
}

const weekDays = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

export default function ProfessionalDashboard() {
  const { professionalId } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [salon, setSalon] = useState<SalonData | null>(null);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [professionalServices, setProfessionalServices] = useState<string[]>([]);
  
  // Revenue filter state
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [editPhoto, setEditPhoto] = useState('');
  const [editDays, setEditDays] = useState<number[]>([]);
  const [editHoursStart, setEditHoursStart] = useState('09:00');
  const [editHoursEnd, setEditHoursEnd] = useState('18:00');
  const [editServices, setEditServices] = useState<string[]>([]);
  
  // Link copy states
  const [copiedStore, setCopiedStore] = useState(false);
  const [copiedPanel, setCopiedPanel] = useState(false);

  // Calculate date ranges based on period
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (revenuePeriod) {
      case 'week':
        return {
          start: format(startOfWeek(now, { locale: ptBR }), 'yyyy-MM-dd'),
          end: format(endOfWeek(now, { locale: ptBR }), 'yyyy-MM-dd'),
        };
      case 'month':
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd'),
        };
      case 'year':
        return {
          start: format(startOfYear(now), 'yyyy-MM-dd'),
          end: format(endOfYear(now), 'yyyy-MM-dd'),
        };
      case 'custom':
        return {
          start: customStart || format(startOfMonth(now), 'yyyy-MM-dd'),
          end: customEnd || format(endOfMonth(now), 'yyyy-MM-dd'),
        };
      default:
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd'),
        };
    }
  }, [revenuePeriod, customStart, customEnd]);

  const applyTheme = useCallback((salonData: SalonData) => {
    const colors = getThemeColors(salonData);
    const root = document.documentElement;
    
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-foreground', colors.primaryForeground);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--secondary', colors.secondary);
    
    const gradient = `linear-gradient(135deg, hsl(${colors.secondary}) 0%, hsl(${colors.accent}) 100%)`;
    root.style.setProperty('--gradient-primary', gradient);
    root.style.setProperty('--gradient-hero', gradient);
  }, []);

  const getThemeColors = (salonData: SalonData) => {
    const preset = salonData.theme_preset || 'purple';
    const customColors = salonData.custom_colors;
    
    const presets: Record<string, { primary: string; primaryForeground: string; secondary: string; accent: string }> = {
      purple: { primary: '270 70% 50%', primaryForeground: '0 0% 100%', secondary: '280 60% 55%', accent: '330 80% 60%' },
      rose: { primary: '350 80% 55%', primaryForeground: '0 0% 100%', secondary: '340 75% 60%', accent: '350 70% 70%' },
      gold: { primary: '45 90% 40%', primaryForeground: '0 0% 100%', secondary: '40 85% 50%', accent: '50 90% 60%' },
    };
    
    if (preset === 'custom' && customColors) {
      return {
        primary: customColors.primary || '270 70% 50%',
        primaryForeground: customColors.primaryForeground || '0 0% 100%',
        secondary: customColors.secondary || '320 70% 60%',
        accent: customColors.accent || '330 80% 60%',
      };
    }
    
    return presets[preset] || presets.purple;
  };

  const loadData = useCallback(async () => {
    if (!professionalId) return;
    
    setIsLoading(true);
    try {
      // Load professional
      const { data: prof, error: profError } = await supabase
        .from('professionals')
        .select('id, name, specialty, photo, salon_id, available_days, available_hours')
        .eq('id', professionalId)
        .maybeSingle();

      if (profError || !prof) {
        throw new Error('Profissional não encontrado');
      }

      const availableHours = (prof.available_hours as any) || { start: '09:00', end: '18:00' };
      const mappedProfessional: Professional = {
        id: prof.id,
        name: prof.name,
        specialty: prof.specialty,
        photo: prof.photo,
        salon_id: prof.salon_id,
        available_days: prof.available_days || [1, 2, 3, 4, 5, 6],
        available_hours: { start: availableHours.start || '09:00', end: availableHours.end || '18:00' },
      };
      
      setProfessional(mappedProfessional);
      
      // Initialize edit state
      setEditPhoto(mappedProfessional.photo || '');
      setEditDays(mappedProfessional.available_days);
      setEditHoursStart(mappedProfessional.available_hours.start);
      setEditHoursEnd(mappedProfessional.available_hours.end);

      // Load salon
      const { data: salonData, error: salonError } = await supabase
        .from('salons')
        .select('id, name, slug, logo_url, logo_format, theme_preset, custom_colors')
        .eq('id', prof.salon_id)
        .maybeSingle();

      if (salonError || !salonData) {
        throw new Error('Salão não encontrado');
      }

      setSalon(salonData as SalonData);
      applyTheme(salonData as SalonData);

      // Load all salon services
      const { data: servicesData } = await supabase
        .from('services')
        .select('id, name, price, duration')
        .eq('salon_id', prof.salon_id)
        .eq('is_active', true);
      
      setAllServices(servicesData || []);

      // Load professional services
      const { data: profServicesData } = await supabase
        .from('professional_services')
        .select('service_id')
        .eq('professional_id', professionalId);
      
      const profServiceIds = (profServicesData || []).map(ps => ps.service_id);
      setProfessionalServices(profServiceIds);
      setEditServices(profServiceIds);

      // Load appointments with services
      const { data: appts, error: apptsError } = await supabase
        .from('appointments')
        .select('id, date, time, status, client_name, service_id')
        .eq('professional_id', professionalId)
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (apptsError) throw apptsError;

      // Get service details
      const serviceIds = [...new Set((appts || []).map(a => a.service_id).filter(Boolean))];
      let servicesMap: Record<string, Service> = {};
      
      if (serviceIds.length > 0) {
        const { data: svcData } = await supabase
          .from('services')
          .select('id, name, price, duration')
          .in('id', serviceIds);
        
        servicesMap = (svcData || []).reduce((acc, s) => {
          acc[s.id] = s;
          return acc;
        }, {} as typeof servicesMap);
      }

      const mappedAppointments: Appointment[] = (appts || []).map(a => ({
        id: a.id,
        date: a.date,
        time: a.time,
        status: a.status,
        client_name: a.client_name,
        service: a.service_id ? servicesMap[a.service_id] || null : null,
      }));

      setAppointments(mappedAppointments);

      if (salonData?.name && prof?.name) {
        document.title = `${prof.name} | ${salonData.name}`;
      }
    } catch (error) {
      console.error('Error loading professional data:', error);
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [professionalId, applyTheme]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime subscription
  useEffect(() => {
    if (!professionalId) return;

    const channel = supabase
      .channel(`prof-appointments-${professionalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `professional_id=eq.${professionalId}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [professionalId, loadData]);

  // Appointment actions
  const handleConfirmAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', id);
      
      if (error) throw error;
      
      setAppointments(prev => prev.map(a => 
        a.id === id ? { ...a, status: 'confirmed' } : a
      ));
      toast({ title: 'Agendamento confirmado!' });
    } catch (error) {
      toast({ title: 'Erro ao confirmar', variant: 'destructive' });
    }
  };

  const handleCancelAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id);
      
      if (error) throw error;
      
      setAppointments(prev => prev.map(a => 
        a.id === id ? { ...a, status: 'cancelled' } : a
      ));
      toast({ title: 'Agendamento cancelado' });
    } catch (error) {
      toast({ title: 'Erro ao cancelar', variant: 'destructive' });
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setAppointments(prev => prev.filter(a => a.id !== id));
      toast({ title: 'Agendamento excluído' });
    } catch (error) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setEditPhoto(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setEditPhoto('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDayToggle = (day: number) => {
    setEditDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const handleServiceToggle = (serviceId: string) => {
    setEditServices(prev => 
      prev.includes(serviceId) ? prev.filter(s => s !== serviceId) : [...prev, serviceId]
    );
  };

  const handleSaveSettings = async () => {
    if (!professional) return;
    
    setIsSaving(true);
    try {
      const { error: profError } = await supabase
        .from('professionals')
        .update({
          photo: editPhoto || null,
          available_days: editDays,
          available_hours: { start: editHoursStart, end: editHoursEnd },
        })
        .eq('id', professional.id);
      
      if (profError) throw profError;

      await supabase.from('professional_services').delete().eq('professional_id', professional.id);
      if (editServices.length > 0) {
        const rows = editServices.map(serviceId => ({
          professional_id: professional.id,
          service_id: serviceId,
        }));
        const { error } = await supabase.from('professional_services').insert(rows);
        if (error) throw error;
      }

      toast({ title: 'Configurações salvas com sucesso!' });
      
      setProfessional({
        ...professional,
        photo: editPhoto || null,
        available_days: editDays,
        available_hours: { start: editHoursStart, end: editHoursEnd },
      });
      setProfessionalServices(editServices);
      setShowSettings(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: 'Erro ao salvar configurações', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Link da loja (para clientes agendarem)
  const getStoreLink = () => {
    const baseUrl = window.location.origin;
    if (salon?.slug) {
      return `${baseUrl}/salao/${salon.slug}`;
    }
    return `${baseUrl}/salon/${salon?.id}`;
  };

  // Link personalizado do profissional (painel dele)
  const getProfessionalPanelLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/profissional/${professionalId}`;
  };

  // Link de agendamento direto com o profissional (para clientes)
  const getClientBookingLink = () => {
    const baseUrl = window.location.origin;
    if (salon?.slug) {
      return `${baseUrl}/salao/${salon.slug}/profissional/${professionalId}`;
    }
    return `${baseUrl}/salon/${salon?.id}/professional/${professionalId}`;
  };


  const copyStoreLink = async () => {
    try {
      await navigator.clipboard.writeText(getStoreLink());
      setCopiedStore(true);
      toast({ title: 'Link da loja copiado!' });
      setTimeout(() => setCopiedStore(false), 2000);
    } catch {
      toast({ title: 'Erro ao copiar link', variant: 'destructive' });
    }
  };

  const copyPanelLink = async () => {
    try {
      await navigator.clipboard.writeText(getProfessionalPanelLink());
      setCopiedPanel(true);
      toast({ title: 'Link do painel copiado!' });
      setTimeout(() => setCopiedPanel(false), 2000);
    } catch {
      toast({ title: 'Erro ao copiar link', variant: 'destructive' });
    }
  };

  const openPanelLink = () => {
    window.open(getProfessionalPanelLink(), '_blank');
  };

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Filtered appointments for revenue
  const revenueAppointments = useMemo(() => {
    return appointments.filter(a => 
      a.date >= dateRange.start && 
      a.date <= dateRange.end &&
      (a.status === 'confirmed' || a.status === 'completed')
    );
  }, [appointments, dateRange]);

  const totalRevenue = revenueAppointments.reduce((sum, a) => sum + (a.service?.price || 0), 0);
  const avgRevenue = revenueAppointments.length > 0 ? totalRevenue / revenueAppointments.length : 0;

  const serviceStats = useMemo(() => {
    const stats: Record<string, ServiceStats> = {};
    revenueAppointments.forEach(a => {
      if (a.service) {
        if (!stats[a.service.id]) {
          stats[a.service.id] = { name: a.service.name, count: 0, revenue: 0 };
        }
        stats[a.service.id].count++;
        stats[a.service.id].revenue += a.service.price;
      }
    });
    return Object.values(stats).sort((a, b) => b.count - a.count);
  }, [revenueAppointments]);

  // Upcoming appointments (not cancelled)
  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter(a => a.date >= todayStr && a.status !== 'cancelled')
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      })
      .slice(0, 10);
  }, [appointments, todayStr]);

  const myServices = allServices.filter(s => professionalServices.includes(s.id));

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

  if (!professional || !salon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Profissional não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
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
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-semibold text-foreground truncate">{professional.name}</h1>
            <p className="text-xs text-muted-foreground truncate">{salon.name}</p>
          </div>
          {professional.photo ? (
            <img src={professional.photo} alt={professional.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-semibold shrink-0">
              {professional.name[0]}
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Links section */}
        <Card className="p-4 border-0 shadow-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Links</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Link da Loja */}
            <div className="flex-1 flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Link da Loja</p>
                <p className="text-sm font-medium text-foreground truncate">{getStoreLink()}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={copyStoreLink}
              >
                {copiedStore ? <Check className="w-4 h-4 text-green-500" /> : <Link className="w-4 h-4" />}
              </Button>
            </div>

            {/* Link Personalizado (Painel do Profissional) */}
            <div className="flex-1 flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Meu Painel</p>
                <p className="text-sm font-medium text-foreground truncate">{getProfessionalPanelLink()}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={copyPanelLink}
              >
                {copiedPanel ? <Check className="w-4 h-4 text-green-500" /> : <Link className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                onClick={openPanelLink}
                title="Ver painel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              </Button>
            </div>
          </div>
        </Card>

        {/* Settings button */}
        <div className="flex justify-end">
          <Button
            variant={showSettings ? 'secondary' : 'outline'}
            className="gap-2"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4" />
            Configurações
            {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <Card className="p-6 border-0 shadow-card animate-fade-in-up">
            <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Minhas Configurações
            </h2>
            
            <div className="space-y-6">
              {/* Photo */}
              <div className="space-y-2">
                <Label>Foto de Perfil</Label>
                <div className="flex items-start gap-4">
                  <div className="relative w-20 h-20 bg-muted border-2 border-dashed border-border rounded-full overflow-hidden flex items-center justify-center">
                    {editPhoto ? (
                      <>
                        <img src={editPhoto} alt="Foto" className="w-full h-full object-cover rounded-full" />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute top-0 right-0 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/80"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-2">
                        <Upload className="w-5 h-5 mx-auto text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="prof-photo-upload"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Escolher Foto
                    </Button>
                  </div>
                </div>
              </div>

              {/* Available days */}
              <div className="space-y-2">
                <Label>Dias de Trabalho</Label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map(day => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-day-${day.value}`}
                        checked={editDays.includes(day.value)}
                        onCheckedChange={() => handleDayToggle(day.value)}
                      />
                      <Label htmlFor={`edit-day-${day.value}`} className="text-sm cursor-pointer">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-start">Horário Início</Label>
                  <Input
                    id="edit-start"
                    type="time"
                    value={editHoursStart}
                    onChange={(e) => setEditHoursStart(e.target.value)}
                    className="input-elegant"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-end">Horário Fim</Label>
                  <Input
                    id="edit-end"
                    type="time"
                    value={editHoursEnd}
                    onChange={(e) => setEditHoursEnd(e.target.value)}
                    className="input-elegant"
                  />
                </div>
              </div>

              {/* Services */}
              {allServices.length > 0 && (
                <div className="space-y-2">
                  <Label>Serviços que Executo</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                    {allServices.map(service => (
                      <div key={service.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-service-${service.id}`}
                          checked={editServices.includes(service.id)}
                          onCheckedChange={() => handleServiceToggle(service.id)}
                        />
                        <Label htmlFor={`edit-service-${service.id}`} className="text-sm cursor-pointer">
                          {service.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                variant="gradient"
                className="w-full gap-2"
                onClick={handleSaveSettings}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Configurações
              </Button>
            </div>
          </Card>
        )}

        {/* Revenue section with filters */}
        <Card className="p-6 border-0 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Receita
            </h2>
            <RevenueFilter
              period={revenuePeriod}
              onPeriodChange={setRevenuePeriod}
              customStart={customStart}
              customEnd={customEnd}
              onCustomStartChange={setCustomStart}
              onCustomEndChange={setCustomEnd}
            />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-primary/10">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-foreground">{formatPrice(totalRevenue)}</p>
            </div>
            <div className="p-4 rounded-xl bg-accent/10">
              <p className="text-xs text-muted-foreground">Atendimentos</p>
              <p className="text-xl font-bold text-foreground">{revenueAppointments.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/10 col-span-2 sm:col-span-1">
              <p className="text-xs text-muted-foreground">Média/Atendimento</p>
              <p className="text-xl font-bold text-foreground">{formatPrice(avgRevenue)}</p>
            </div>
          </div>
        </Card>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 border-0 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Próximos</p>
                <p className="text-lg font-semibold text-foreground">{upcomingAppointments.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-0 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Meus Serviços</p>
                <p className="text-lg font-semibold text-foreground">{myServices.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Upcoming appointments with actions */}
        <Card className="p-6 border-0 shadow-card">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Próximos Agendamentos
          </h2>
          {upcomingAppointments.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum agendamento próximo</p>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  onConfirm={handleConfirmAppointment}
                  onCancel={handleCancelAppointment}
                  onDelete={handleDeleteAppointment}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Services breakdown */}
        <Card className="p-6 border-0 shadow-card">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Serviços Realizados
          </h2>
          {serviceStats.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum serviço no período</p>
          ) : (
            <div className="space-y-3">
              {serviceStats.map((stat) => (
                <div key={stat.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">{stat.name}</p>
                    <p className="text-xs text-muted-foreground">{stat.count} atendimentos</p>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {formatPrice(stat.revenue)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

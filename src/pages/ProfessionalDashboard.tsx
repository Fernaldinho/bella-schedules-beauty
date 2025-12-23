import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Calendar,
  Clock,
  DollarSign,
  Loader2,
  User,
  TrendingUp,
  Scissors
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SalonData {
  id: string;
  name: string;
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
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  client_name: string;
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
  } | null;
}

interface ServiceStats {
  name: string;
  count: number;
  revenue: number;
}

export default function ProfessionalDashboard() {
  const { professionalId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [salon, setSalon] = useState<SalonData | null>(null);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [period, setPeriod] = useState<'today' | 'month'>('month');

  useEffect(() => {
    if (professionalId) {
      loadData();
    }
  }, [professionalId]);

  useEffect(() => {
    if (salon) {
      applyTheme(salon);
    }
  }, [salon]);

  const applyTheme = (salonData: SalonData) => {
    const colors = getThemeColors(salonData);
    const root = document.documentElement;
    
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-foreground', colors.primaryForeground);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--secondary', colors.secondary);
    
    const gradient = `linear-gradient(135deg, hsl(${colors.secondary}) 0%, hsl(${colors.accent}) 100%)`;
    root.style.setProperty('--gradient-primary', gradient);
    root.style.setProperty('--gradient-hero', gradient);
  };

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

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load professional
      const { data: prof, error: profError } = await supabase
        .from('professionals')
        .select('id, name, specialty, photo, salon_id')
        .eq('id', professionalId)
        .maybeSingle();

      if (profError || !prof) {
        throw new Error('Profissional não encontrado');
      }

      setProfessional(prof);

      // Load salon
      const { data: salonData, error: salonError } = await supabase
        .from('salons')
        .select('id, name, logo_url, logo_format, theme_preset, custom_colors')
        .eq('id', prof.salon_id)
        .maybeSingle();

      if (salonError || !salonData) {
        throw new Error('Salão não encontrado');
      }

      setSalon(salonData as SalonData);

      // Load appointments with services
      const { data: appts, error: apptsError } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          time,
          status,
          client_name,
          service_id
        `)
        .eq('professional_id', professionalId)
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (apptsError) throw apptsError;

      // Get service details
      const serviceIds = [...new Set((appts || []).map(a => a.service_id).filter(Boolean))];
      let servicesMap: Record<string, { id: string; name: string; price: number; duration: number }> = {};
      
      if (serviceIds.length > 0) {
        const { data: servicesData } = await supabase
          .from('services')
          .select('id, name, price, duration')
          .in('id', serviceIds);
        
        servicesMap = (servicesData || []).reduce((acc, s) => {
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
  };

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const filteredAppointments = useMemo(() => {
    if (period === 'today') {
      return appointments.filter(a => a.date === todayStr);
    }
    return appointments.filter(a => a.date >= monthStart && a.date <= monthEnd);
  }, [appointments, period, todayStr, monthStart, monthEnd]);

  const confirmedAppointments = filteredAppointments.filter(a => a.status === 'confirmed' || a.status === 'completed');

  const totalRevenue = confirmedAppointments.reduce((sum, a) => sum + (a.service?.price || 0), 0);

  const serviceStats = useMemo(() => {
    const stats: Record<string, ServiceStats> = {};
    confirmedAppointments.forEach(a => {
      if (a.service) {
        if (!stats[a.service.id]) {
          stats[a.service.id] = { name: a.service.name, count: 0, revenue: 0 };
        }
        stats[a.service.id].count++;
        stats[a.service.id].revenue += a.service.price;
      }
    });
    return Object.values(stats).sort((a, b) => b.count - a.count);
  }, [confirmedAppointments]);

  const upcomingAppointments = appointments
    .filter(a => a.date >= todayStr && (a.status === 'confirmed' || a.status === 'pending'))
    .slice(0, 5);

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
          <div className="flex-1">
            <h1 className="font-display font-semibold text-foreground">{professional.name}</h1>
            <p className="text-xs text-muted-foreground">{salon.name}</p>
          </div>
          {professional.photo ? (
            <img src={professional.photo} alt={professional.name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-semibold">
              {professional.name[0]}
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Period selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('today')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              period === 'today' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            Hoje
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              period === 'month' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            Este Mês
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="p-4 border-0 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receita</p>
                <p className="text-lg font-semibold text-foreground">{formatPrice(totalRevenue)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-0 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Agendamentos</p>
                <p className="text-lg font-semibold text-foreground">{confirmedAppointments.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-0 shadow-card col-span-2 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Serviços</p>
                <p className="text-lg font-semibold text-foreground">{serviceStats.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Upcoming appointments */}
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
                <div key={appt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{appt.client_name}</p>
                      <p className="text-xs text-muted-foreground">{appt.service?.name || 'Serviço'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {format(parseISO(appt.date), "dd/MM", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-muted-foreground">{appt.time}</p>
                  </div>
                </div>
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

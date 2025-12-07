import { AdminLayout } from '@/components/admin/AdminLayout';
import { SubscriptionGate } from '@/components/SubscriptionGate';
import { useSalon } from '@/contexts/SalonContext';
import { Card } from '@/components/ui/card';
import { ClientPageLinks } from '@/components/admin/ClientPageLinks';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Globe
} from 'lucide-react';

export default function Dashboard() {
  const { appointments, services, clients, professionals } = useSalon();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === todayStr && a.status !== 'cancelled');
  
  const confirmedAppointments = appointments.filter(a => a.status === 'confirmed');
  const cancelledAppointments = appointments.filter(a => a.status === 'cancelled');

  const totalRevenue = confirmedAppointments.reduce((acc, apt) => {
    const service = services.find(s => s.id === apt.serviceId);
    return acc + (service?.price || 0);
  }, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  const stats = [
    {
      label: 'Agendamentos Hoje',
      value: todayAppointments.length,
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Total de Clientes',
      value: clients.length,
      icon: Users,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: 'Faturamento Total',
      value: formatPrice(totalRevenue),
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Profissionais',
      value: professionals.length,
      icon: TrendingUp,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-semibold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Visão geral do seu salão</p>
          </div>
          <Card className="p-4 border-0 shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-medium text-foreground">Página do Cliente</span>
            </div>
            <ClientPageLinks />
          </Card>
        </div>

        <SubscriptionGate fallbackMessage="Assine o plano PRO para ver estatísticas completas do seu salão.">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card 
                key={stat.label} 
                className="p-6 border-0 shadow-card animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-semibold text-foreground mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Today's Appointments */}
          <div className="mt-8">
            <h2 className="text-xl font-display font-semibold text-foreground mb-4">
              Agendamentos de Hoje
            </h2>
            {todayAppointments.length === 0 ? (
              <Card className="p-8 text-center border-0 shadow-card">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum agendamento para hoje</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((apt, index) => {
                  const service = services.find(s => s.id === apt.serviceId);
                  const professional = professionals.find(p => p.id === apt.professionalId);

                  return (
                    <Card 
                      key={apt.id} 
                      className="p-4 border-0 shadow-soft animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center text-primary-foreground font-semibold">
                            {apt.time}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{apt.clientName}</p>
                            <p className="text-sm text-muted-foreground">
                              {service?.name} • {professional?.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {apt.status === 'confirmed' ? (
                            <span className="flex items-center gap-1 text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
                              <CheckCircle className="w-4 h-4" />
                              Confirmado
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-sm text-red-600 bg-red-100 px-3 py-1 rounded-full">
                              <XCircle className="w-4 h-4" />
                              Cancelado
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </SubscriptionGate>
      </div>
    </AdminLayout>
  );
}

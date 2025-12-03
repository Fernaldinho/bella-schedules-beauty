import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { SubscriptionGate } from '@/components/SubscriptionGate';
import { useSalon } from '@/contexts/SalonContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDateToBrazil } from '@/lib/dateUtils';

export default function Agenda() {
  const { appointments, services, professionals, cancelAppointment } = useSalon();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateString = (date: Date) => {
    return formatDateToBrazil(date);
  };

  const goToPrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') newDate.setDate(newDate.getDate() - 1);
    else if (view === 'week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') newDate.setDate(newDate.getDate() + 1);
    else if (view === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const filteredAppointments = appointments.filter(apt => {
    if (selectedProfessional !== 'all' && apt.professionalId !== selectedProfessional) {
      return false;
    }
    if (view === 'day') {
      return apt.date === formatDateString(currentDate);
    }
    // Add week/month filtering as needed
    return apt.date === formatDateString(currentDate);
  });

  const sortedAppointments = [...filteredAppointments].sort((a, b) => 
    a.time.localeCompare(b.time)
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-display font-semibold text-foreground">Agenda</h1>
            <p className="text-muted-foreground mt-1">Visualize e gerencie os agendamentos</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {professionals.map(prof => (
                  <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SubscriptionGate fallbackMessage="Assine o plano PRO para ver a agenda completa.">
          <Card className="border-0 shadow-card overflow-hidden">
            {/* Calendar Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-card">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={goToPrev}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={goToNext}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Hoje
                </Button>
              </div>
              <h2 className="font-display font-semibold text-lg text-foreground capitalize">
                {formatDate(currentDate)}
              </h2>
              <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
                <TabsList>
                  <TabsTrigger value="day">Dia</TabsTrigger>
                  <TabsTrigger value="week">Semana</TabsTrigger>
                  <TabsTrigger value="month">Mês</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Appointments List */}
            <div className="p-4">
              {sortedAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum agendamento para esta data</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedAppointments.map((apt, index) => {
                    const service = services.find(s => s.id === apt.serviceId);
                    const professional = professionals.find(p => p.id === apt.professionalId);

                    return (
                      <Card 
                        key={apt.id} 
                        className={`p-4 border-l-4 ${
                          apt.status === 'cancelled' 
                            ? 'border-l-destructive bg-destructive/5' 
                            : 'border-l-primary'
                        } animate-fade-in`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                              apt.status === 'cancelled' ? 'bg-destructive/10' : 'gradient-primary'
                            }`}>
                              <span className={`text-lg font-bold ${
                                apt.status === 'cancelled' ? 'text-destructive' : 'text-primary-foreground'
                              }`}>
                                {apt.time}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{apt.clientName}</p>
                              <p className="text-sm text-muted-foreground">
                                {service?.name} • {professional?.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                📱 {apt.clientPhone}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {apt.status === 'confirmed' ? (
                              <>
                                <span className="flex items-center gap-1 text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
                                  <CheckCircle className="w-4 h-4" />
                                  Confirmado
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => cancelAppointment(apt.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  Cancelar
                                </Button>
                              </>
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
          </Card>
        </SubscriptionGate>
      </div>
    </AdminLayout>
  );
}

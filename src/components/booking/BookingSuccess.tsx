import { CheckCircle, Calendar, Clock, User, Sparkles, MessageCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Service, Professional } from '@/types/salon';
import { useSalon } from '@/contexts/SalonContext';
import { Link } from 'react-router-dom';

interface BookingSuccessProps {
  service: Service;
  professional: Professional;
  date: string;
  time: string;
  clientName: string;
  onNewBooking: () => void;
}

export function BookingSuccess({ 
  service, 
  professional, 
  date, 
  time, 
  clientName,
  onNewBooking 
}: BookingSuccessProps) {
  const { settings } = useSalon();

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `✨ *Novo Agendamento - ${settings.name}*\n\n` +
      `👤 Cliente: ${clientName}\n` +
      `💇 Serviço: ${service.name}\n` +
      `👩 Profissional: ${professional.name}\n` +
      `📅 Data: ${formatDate(date)}\n` +
      `🕐 Horário: ${time}\n` +
      `💰 Valor: ${formatPrice(service.price)}`
    );
    window.open(`https://wa.me/55${settings.whatsapp}?text=${message}`, '_blank');
  };

  return (
    <div className="text-center space-y-6 animate-fade-in-up">
      {/* Home Button */}
      <div className="flex justify-start">
        <Button asChild variant="ghost" className="gap-2">
          <Link to="/">
            <Home className="w-4 h-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto shadow-glow animate-scale-in">
        <CheckCircle className="w-10 h-10 text-primary-foreground" />
      </div>

      <div>
        <h2 className="text-3xl font-display font-semibold text-foreground mb-2">
          Agendamento Confirmado!
        </h2>
        <p className="text-muted-foreground">
          Seu momento de beleza está reservado 💖
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 max-w-sm mx-auto space-y-4 text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Serviço</p>
            <p className="font-medium text-foreground">{service.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Profissional</p>
            <p className="font-medium text-foreground">{professional.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Data</p>
            <p className="font-medium text-foreground">{formatDate(date)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Horário</p>
            <p className="font-medium text-foreground">{time}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Valor</span>
            <span className="text-xl font-semibold text-gradient">{formatPrice(service.price)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 max-w-sm mx-auto">
        <Button
          variant="hero"
          size="xl"
          className="w-full"
          onClick={handleWhatsApp}
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Enviar via WhatsApp
        </Button>

        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={onNewBooking}
        >
          Fazer Novo Agendamento
        </Button>

        <Button asChild variant="outline" size="lg" className="w-full">
          <Link to="/">
            <Home className="w-4 h-4 mr-2" />
            Voltar para Início
          </Link>
        </Button>
      </div>
    </div>
  );
}

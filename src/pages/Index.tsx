import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ProfessionalCard } from '@/components/ProfessionalCard';
import { useSalon } from '@/contexts/SalonContext';
import { ServiceSelector } from '@/components/booking/ServiceSelector';
import { ProfessionalSelector } from '@/components/booking/ProfessionalSelector';
import { CalendarPicker } from '@/components/booking/CalendarPicker';
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker';
import { ClientForm } from '@/components/booking/ClientForm';
import { BookingSuccess } from '@/components/booking/BookingSuccess';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { Service, Professional } from '@/types/salon';
import { cn } from '@/lib/utils';
import { 
  Calendar, 
  Sparkles, 
  Heart, 
  Star, 
  ChevronRight, 
  ArrowLeft,
  Instagram,
  MessageCircle
} from 'lucide-react';

type BookingStep = 'landing' | 'service' | 'professional' | 'date' | 'time' | 'form' | 'success';

const Index = () => {
  const { professionals, settings, addAppointment, getProfessionalsForService } = useSalon();
  const [step, setStep] = useState<BookingStep>('landing');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableProfessionals, setAvailableProfessionals] = useState<Professional[]>([]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    const profs = getProfessionalsForService(service.id);
    setAvailableProfessionals(profs);
    
    // If only one professional, auto-select and skip to date
    if (profs.length === 1) {
      setSelectedProfessional(profs[0]);
      setStep('date');
    } else {
      setStep('professional');
    }
  };

  const handleProfessionalSelect = (professional: Professional) => {
    setSelectedProfessional(professional);
    setStep('date');
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setStep('time');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('form');
  };

  const handleFormSubmit = async (name: string, phone: string) => {
    if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    setClientName(name);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    addAppointment({
      clientName: name,
      clientPhone: phone,
      serviceId: selectedService.id,
      professionalId: selectedProfessional.id,
      date: selectedDate,
      time: selectedTime,
      status: 'confirmed',
    });

    setIsSubmitting(false);
    setStep('success');
  };

  const handleNewBooking = () => {
    setSelectedService(null);
    setSelectedProfessional(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setClientName('');
    setAvailableProfessionals([]);
    setStep('landing');
  };

  const handleBack = () => {
    switch (step) {
      case 'service':
        setStep('landing');
        break;
      case 'professional':
        setStep('service');
        setSelectedService(null);
        setAvailableProfessionals([]);
        break;
      case 'date':
        if (availableProfessionals.length > 1) {
          setStep('professional');
          setSelectedProfessional(null);
        } else {
          setStep('service');
          setSelectedService(null);
          setSelectedProfessional(null);
        }
        break;
      case 'time':
        setStep('date');
        setSelectedDate(null);
        break;
      case 'form':
        setStep('time');
        setSelectedTime(null);
        break;
      default:
        break;
    }
  };

  // Booking Flow
  if (step !== 'landing') {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            {step !== 'success' && (
              <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex-1 flex items-center gap-3">
              {settings.logoUrl && (
                <img
                  src={settings.logoUrl}
                  alt={settings.name}
                  className={cn(
                    'h-8 object-contain',
                    settings.logoFormat === 'circular' && 'rounded-full',
                    settings.logoFormat === 'square' && 'rounded-lg'
                  )}
                />
              )}
              <div>
                <h1 className="font-display font-semibold text-foreground">{settings.name}</h1>
                <p className="text-xs text-muted-foreground">Agendamento Online</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          {step === 'service' && (
            <ServiceSelector selectedService={selectedService} onSelect={handleServiceSelect} />
          )}
          {step === 'professional' && (
            <ProfessionalSelector
              professionals={availableProfessionals}
              selectedProfessional={selectedProfessional}
              onSelect={handleProfessionalSelect}
            />
          )}
          {step === 'date' && selectedProfessional && (
            <CalendarPicker
              professionalId={selectedProfessional.id}
              selectedDate={selectedDate}
              onSelect={handleDateSelect}
            />
          )}
          {step === 'time' && selectedProfessional && selectedDate && (
            <TimeSlotPicker
              professionalId={selectedProfessional.id}
              date={selectedDate}
              selectedTime={selectedTime}
              onSelect={handleTimeSelect}
            />
          )}
          {step === 'form' && (
            <ClientForm onSubmit={handleFormSubmit} isLoading={isSubmitting} />
          )}
          {step === 'success' && selectedService && selectedProfessional && selectedDate && selectedTime && (
            <BookingSuccess
              service={selectedService}
              professional={selectedProfessional}
              date={selectedDate}
              time={selectedTime}
              clientName={clientName}
              onNewBooking={handleNewBooking}
            />
          )}
        </main>
      </div>
    );
  }

  // Landing Page
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <ClientHeader />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 gradient-soft" />
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Seu momento de beleza</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              {settings.welcomeText || `Agende seu momento de beleza no ${settings.name} 💖`}
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              {settings.description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Button 
                variant="hero" 
                size="xl" 
                onClick={() => setStep('service')}
                className="group"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Agendar Agora
                <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Social Links */}
            {(settings.socialMedia?.instagram || settings.socialMedia?.whatsapp) && (
              <div className="flex items-center justify-center gap-4 mt-8 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
                {settings.socialMedia?.instagram && (
                  <a
                    href={`https://instagram.com/${settings.socialMedia.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                    @{settings.socialMedia.instagram.replace('@', '')}
                  </a>
                )}
                {settings.socialMedia?.whatsapp && (
                  <a
                    href={`https://wa.me/${settings.socialMedia.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                )}
              </div>
            )}

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6 mt-8 animate-fade-in-up flex-wrap" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="w-4 h-4 text-accent fill-accent" />
                <span>{settings.stats?.rating || '4.9'} estrelas</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-border hidden sm:block" />
              <div className="text-sm text-muted-foreground">
                {settings.stats?.clientCount || '+500'} clientes satisfeitas
              </div>
              <div className="w-1 h-1 rounded-full bg-border hidden sm:block" />
              <div className="text-sm text-muted-foreground">
                Desde {settings.stats?.since || '2020'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professionals Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground mb-4">
              Nossas Profissionais
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Uma equipe dedicada a realçar sua beleza natural com expertise e carinho
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {professionals.map((professional, index) => (
              <div 
                key={professional.id} 
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ProfessionalCard professional={professional} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="glass-card rounded-3xl p-8 md:p-12 max-w-4xl mx-auto text-center">
            <Sparkles className="w-12 h-12 text-accent mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground mb-4">
              Pronta para se transformar?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Reserve seu horário agora e deixe-nos cuidar de você com todo o carinho que você merece.
            </p>
            <Button 
              variant="hero" 
              size="xl"
              onClick={() => setStep('service')}
            >
              <Calendar className="w-5 h-5 mr-2" />
              Agendar Meu Horário
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 {settings.name}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

import { ReactNode } from 'react';
import { useSalon } from '@/contexts/SalonContext';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';

interface SubscriptionGateProps {
  children: ReactNode;
  fallbackMessage?: string;
}

export function SubscriptionGate({ children, fallbackMessage }: SubscriptionGateProps) {
  const { subscription, activateSubscription } = useSalon();

  if (subscription.isActive) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="blur-locked">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-2xl">
        <div className="text-center p-8 max-w-md animate-scale-in">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
            <Lock className="w-8 h-8 text-primary-foreground" />
          </div>
          <h3 className="text-2xl font-display font-semibold mb-3 text-foreground">
            Conteúdo Exclusivo PRO
          </h3>
          <p className="text-muted-foreground mb-6 font-body">
            {fallbackMessage || 'Assine o plano PRO para liberar acesso completo a todas as funcionalidades.'}
          </p>
          <Button 
            variant="hero" 
            size="xl" 
            onClick={activateSubscription}
            className="group"
          >
            <Sparkles className="w-5 h-5 mr-2 group-hover:animate-pulse" />
            Assinar por R$ 45,30/mês
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            ✨ Profissionais ilimitadas • Agenda completa • Relatórios
          </p>
        </div>
      </div>
    </div>
  );
}

import { Professional } from '@/types/salon';
import { Card } from '@/components/ui/card';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfessionalSelectorProps {
  professionals: Professional[];
  selectedProfessional: Professional | null;
  onSelect: (professional: Professional) => void;
}

export function ProfessionalSelector({ professionals, selectedProfessional, onSelect }: ProfessionalSelectorProps) {
  if (professionals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum profissional disponível para este serviço.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <User className="w-8 h-8 text-accent mx-auto mb-3" />
        <h2 className="text-2xl font-display font-semibold text-foreground">
          Escolha o Profissional
        </h2>
        <p className="text-muted-foreground mt-2">
          Selecione quem vai te atender
        </p>
      </div>

      <div className="grid gap-4 max-w-md mx-auto">
        {professionals.map((professional, index) => {
          const isSelected = selectedProfessional?.id === professional.id;

          return (
            <Card
              key={professional.id}
              onClick={() => onSelect(professional)}
              className={cn(
                "p-4 cursor-pointer transition-all duration-300 border-2",
                "hover:shadow-card hover:border-primary/30",
                "animate-fade-in",
                isSelected 
                  ? "border-primary bg-primary/5 shadow-card" 
                  : "border-transparent bg-card"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {professional.photo ? (
                    <img
                      src={professional.photo}
                      alt={professional.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{professional.name}</h4>
                  <p className="text-sm text-muted-foreground">{professional.specialty}</p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

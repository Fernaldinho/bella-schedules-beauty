import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RevenuePeriod = 'week' | 'month' | 'year' | 'custom';

interface RevenueFilterProps {
  period: RevenuePeriod;
  onPeriodChange: (period: RevenuePeriod) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (date: string) => void;
  onCustomEndChange: (date: string) => void;
}

const periodLabels: Record<RevenuePeriod, string> = {
  week: 'Esta Semana',
  month: 'Este Mês',
  year: 'Este Ano',
  custom: 'Personalizado',
};

export function RevenueFilter({
  period,
  onPeriodChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
}: RevenueFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePeriodSelect = (newPeriod: RevenuePeriod) => {
    onPeriodChange(newPeriod);
    if (newPeriod !== 'custom') {
      setIsOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Quick filters */}
      <div className="flex gap-1 flex-wrap">
        {(['week', 'month', 'year'] as RevenuePeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => handlePeriodSelect(p)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              period === p
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* Custom period popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={period === 'custom' ? 'default' : 'outline'}
            size="sm"
            className="gap-1"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Personalizado</span>
            <ChevronDown className="w-3 h-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-start">Data Inicial</Label>
              <Input
                id="custom-start"
                type="date"
                value={customStart}
                onChange={(e) => onCustomStartChange(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-end">Data Final</Label>
              <Input
                id="custom-end"
                type="date"
                value={customEnd}
                onChange={(e) => onCustomEndChange(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                onPeriodChange('custom');
                setIsOpen(false);
              }}
            >
              Aplicar Filtro
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

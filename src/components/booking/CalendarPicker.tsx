import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSalon } from '@/contexts/SalonContext';
import { cn } from '@/lib/utils';
import { formatDateToBrazil } from '@/lib/dateUtils';

interface CalendarPickerProps {
  professionalId: string;
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

export function CalendarPicker({ professionalId, selectedDate, onSelect }: CalendarPickerProps) {
  const { professionals } = useSalon();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const professional = professionals.find(p => p.id === professionalId);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);

  const isDateAvailable = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) return false;
    if (!professional) return false;

    return professional.availableDays.includes(date.getDay());
  };

  const formatDateString = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return formatDateToBrazil(date);
  };

  const isSelected = (day: number) => {
    return formatDateString(day) === selectedDate;
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const renderDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const available = isDateAvailable(day);
      const selected = isSelected(day);

      days.push(
        <button
          key={day}
          onClick={() => available && onSelect(formatDateString(day))}
          disabled={!available}
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200",
            available && !selected && "hover:bg-primary/10 text-foreground cursor-pointer",
            !available && "text-muted-foreground/40 cursor-not-allowed",
            selected && "gradient-primary text-primary-foreground shadow-soft"
          )}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Calendar className="w-8 h-8 text-accent mx-auto mb-3" />
        <h2 className="text-2xl font-display font-semibold text-foreground">
          Escolha a Data
        </h2>
        <p className="text-muted-foreground mt-2">
          Selecione o dia para seu agendamento
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 max-w-sm mx-auto">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevMonth}
            className="rounded-full hover:bg-primary/10"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h3 className="font-display font-semibold text-lg text-foreground">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="rounded-full hover:bg-primary/10"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="h-10 flex items-center justify-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {renderDays()}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full gradient-primary" />
            <span>Selecionado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted" />
            <span>Disponível</span>
          </div>
        </div>
      </div>
    </div>
  );
}

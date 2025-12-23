import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Check, X, Trash2, User, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

interface AppointmentCardProps {
  appointment: Appointment;
  onConfirm: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  formatPrice: (price: number) => string;
}

export function AppointmentCard({ 
  appointment, 
  onConfirm, 
  onCancel, 
  onDelete,
  formatPrice 
}: AppointmentCardProps) {
  const [isLoading, setIsLoading] = useState<'confirm' | 'cancel' | 'delete' | null>(null);

  const handleConfirm = async () => {
    setIsLoading('confirm');
    await onConfirm(appointment.id);
    setIsLoading(null);
  };

  const handleCancel = async () => {
    setIsLoading('cancel');
    await onCancel(appointment.id);
    setIsLoading(null);
  };

  const handleDelete = async () => {
    setIsLoading('delete');
    await onDelete(appointment.id);
    setIsLoading(null);
  };

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'Pendente', variant: 'outline' },
    confirmed: { label: 'Confirmado', variant: 'default' },
    cancelled: { label: 'Cancelado', variant: 'destructive' },
    completed: { label: 'Concluído', variant: 'secondary' },
  };

  const status = statusConfig[appointment.status] || statusConfig.pending;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground truncate">{appointment.client_name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {appointment.service?.name || 'Serviço'}
            {appointment.service && ` • ${formatPrice(appointment.service.price)}`}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between sm:justify-end gap-3">
        <div className="text-left sm:text-right">
          <p className="text-sm font-medium text-foreground">
            {format(parseISO(appointment.date), "dd/MM", { locale: ptBR })}
          </p>
          <p className="text-xs text-muted-foreground">{appointment.time}</p>
        </div>
        
        <Badge variant={status.variant} className="shrink-0">
          {status.label}
        </Badge>
      </div>
      
      {/* Actions */}
      {appointment.status !== 'cancelled' && (
        <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-border/50 sm:pl-3">
          {appointment.status === 'pending' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleConfirm}
              disabled={isLoading !== null}
              className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              {isLoading === 'confirm' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span className="ml-1 hidden sm:inline">Confirmar</span>
            </Button>
          )}
          
          {appointment.status !== 'cancelled' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading !== null}
              className="h-8 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            >
              {isLoading === 'cancel' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
              <span className="ml-1 hidden sm:inline">Cancelar</span>
            </Button>
          )}
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isLoading !== null}
                className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {isLoading === 'delete' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span className="ml-1 hidden sm:inline">Excluir</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir agendamento?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O agendamento de {appointment.client_name} será removido permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}

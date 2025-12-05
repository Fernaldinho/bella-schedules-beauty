import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { SubscriptionGate } from '@/components/SubscriptionGate';
import { useSalon } from '@/contexts/SalonContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProfessionalForm } from '@/components/admin/ProfessionalForm';
import { Professional } from '@/types/salon';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Professionals() {
  const { professionals, services, deleteProfessional } = useSalon();
  const [formOpen, setFormOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [professionalToDelete, setProfessionalToDelete] = useState<Professional | null>(null);

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const handleAdd = () => {
    setEditingProfessional(null);
    setFormOpen(true);
  };

  const handleEdit = (professional: Professional) => {
    setEditingProfessional(professional);
    setFormOpen(true);
  };

  const handleDeleteClick = (professional: Professional) => {
    setProfessionalToDelete(professional);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (professionalToDelete) {
      deleteProfessional(professionalToDelete.id);
      toast({ title: 'Profissional removida com sucesso!' });
    }
    setDeleteDialogOpen(false);
    setProfessionalToDelete(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-semibold text-foreground">Profissionais</h1>
            <p className="text-muted-foreground mt-1">Gerencie a equipe do salão</p>
          </div>
          <Button variant="gradient" onClick={handleAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Profissional
          </Button>
        </div>

        <SubscriptionGate fallbackMessage="Assine o plano PRO para gerenciar suas profissionais.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {professionals.map((professional, index) => {
              // Get services from both professional.services array AND services where professionalId matches
              const professionalServices = services.filter(s => 
                professional.services?.includes(s.id) || s.professionalId === professional.id
              );

              return (
                <Card 
                  key={professional.id} 
                  className="overflow-hidden border-0 shadow-card animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <div className="absolute inset-0 gradient-hero opacity-30" />
                    <img
                      src={professional.photo}
                      alt={professional.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-primary-foreground">
                      <h3 className="font-display text-2xl font-semibold">{professional.name}</h3>
                      <p className="text-sm opacity-90">{professional.specialty}</p>
                    </div>
                    <div className="absolute top-3 right-3 flex gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
                        onClick={() => handleEdit(professional)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => handleDeleteClick(professional)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Dias de trabalho</p>
                      <div className="flex gap-1">
                        {weekDays.map((day, i) => (
                          <Badge
                            key={day}
                            variant={professional.availableDays.includes(i) ? 'default' : 'secondary'}
                            className={professional.availableDays.includes(i) ? 'gradient-primary' : ''}
                          >
                            {day}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Horário</p>
                      <p className="text-foreground">
                        {professional.availableHours.start} - {professional.availableHours.end}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Serviços ({professionalServices.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {professionalServices.map(service => (
                          <Badge key={service.id} variant="outline">
                            {service.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </SubscriptionGate>
      </div>

      <ProfessionalForm
        open={formOpen}
        onOpenChange={setFormOpen}
        professional={editingProfessional}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {professionalToDelete?.name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

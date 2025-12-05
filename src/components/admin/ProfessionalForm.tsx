import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Professional, Service } from '@/types/salon';
import { useSalon } from '@/contexts/SalonContext';
import { toast } from '@/hooks/use-toast';
import { Save, X, Upload } from 'lucide-react';

interface ProfessionalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professional?: Professional | null;
}

const weekDays = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

export function ProfessionalForm({ open, onOpenChange, professional }: ProfessionalFormProps) {
  const { services, addProfessional, updateProfessional } = useSalon();
  const isEditing = !!professional;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    photo: '',
    availableDays: [1, 2, 3, 4, 5] as number[],
    availableHoursStart: '09:00',
    availableHoursEnd: '18:00',
    selectedServices: [] as string[],
  });

  useEffect(() => {
    if (professional) {
      setFormData({
        name: professional.name,
        specialty: professional.specialty,
        photo: professional.photo,
        availableDays: professional.availableDays,
        availableHoursStart: professional.availableHours.start,
        availableHoursEnd: professional.availableHours.end,
        selectedServices: professional.services || [],
      });
    } else {
      setFormData({
        name: '',
        specialty: '',
        photo: '/placeholder.svg',
        availableDays: [1, 2, 3, 4, 5],
        availableHoursStart: '09:00',
        availableHoursEnd: '18:00',
        selectedServices: [],
      });
    }
  }, [professional, open]);

  const handleDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day].sort(),
    }));
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(s => s !== serviceId)
        : [...prev.selectedServices, serviceId],
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFormData(prev => ({ ...prev, photo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, photo: '/placeholder.svg' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.specialty.trim()) {
      toast({ title: 'Preencha nome e especialidade', variant: 'destructive' });
      return;
    }

    const professionalData = {
      name: formData.name,
      specialty: formData.specialty,
      photo: formData.photo || '/placeholder.svg',
      services: formData.selectedServices,
      availableDays: formData.availableDays,
      availableHours: {
        start: formData.availableHoursStart,
        end: formData.availableHoursEnd,
      },
    };

    if (isEditing && professional) {
      updateProfessional(professional.id, professionalData);
      toast({ title: 'Profissional atualizada com sucesso!' });
    } else {
      addProfessional(professionalData);
      toast({ title: 'Profissional adicionada com sucesso!' });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {isEditing ? 'Editar Profissional' : 'Nova Profissional'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome da profissional"
                className="input-elegant"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidade</Label>
              <Input
                id="specialty"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                placeholder="Ex: Cabeleireira, Nail Designer"
                className="input-elegant"
              />
            </div>

            <div className="space-y-2">
              <Label>Foto</Label>
              <div className="flex items-start gap-4">
                <div className="relative w-24 h-24 bg-muted border-2 border-dashed border-border rounded-full overflow-hidden flex items-center justify-center">
                  {formData.photo && formData.photo !== '/placeholder.svg' ? (
                    <>
                      <img
                        src={formData.photo}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-full"
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute top-0 right-0 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/80"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-2">
                      <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">Sem foto</p>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="professional-photo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Escolher Foto
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG ou WEBP
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dias de Trabalho</Label>
              <div className="grid grid-cols-4 gap-2">
                {weekDays.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={formData.availableDays.includes(day.value)}
                      onCheckedChange={() => handleDayToggle(day.value)}
                    />
                    <Label htmlFor={`day-${day.value}`} className="text-sm cursor-pointer">
                      {day.label.slice(0, 3)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Horário Início</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.availableHoursStart}
                  onChange={(e) => setFormData({ ...formData, availableHoursStart: e.target.value })}
                  className="input-elegant"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Horário Fim</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.availableHoursEnd}
                  onChange={(e) => setFormData({ ...formData, availableHoursEnd: e.target.value })}
                  className="input-elegant"
                />
              </div>
            </div>

            {services.length > 0 && (
              <div className="space-y-2">
                <Label>Serviços Vinculados</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={formData.selectedServices.includes(service.id)}
                        onCheckedChange={() => handleServiceToggle(service.id)}
                      />
                      <Label htmlFor={`service-${service.id}`} className="text-sm cursor-pointer">
                        {service.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
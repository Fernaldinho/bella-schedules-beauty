import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { SubscriptionGate } from '@/components/SubscriptionGate';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Clock, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type DbProfessional = { id: string; name: string; specialty: string | null };

type UiService = {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
  professionalId: string;
};

export default function Services() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [salonId, setSalonId] = useState<string | null>(null);

  const [professionals, setProfessionals] = useState<DbProfessional[]>([]);
  const [services, setServices] = useState<UiService[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration: '',
    professionalId: '',
    category: '',
  });

  const categories = ['Cabelo', 'Unhas', 'Cílios', 'Depilação', 'Estética', 'Maquiagem', 'Geral'];

  const resetForm = () => {
    setFormData({ name: '', price: '', duration: '', professionalId: '', category: '' });
    setEditingService(null);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const professionalById = useMemo(() => {
    const map = new Map<string, DbProfessional>();
    professionals.forEach((p) => map.set(p.id, p));
    return map;
  }, [professionals]);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setSalonId(null);
        setProfessionals([]);
        setServices([]);
        return;
      }

      const { data: salon, error: salonError } = await supabase
        .from('salons')
        .select('id')
        .eq('owner_id', auth.user.id)
        .maybeSingle();
      if (salonError) throw salonError;
      if (!salon?.id) {
        setSalonId(null);
        setProfessionals([]);
        setServices([]);
        return;
      }
      setSalonId(salon.id);

      const [{ data: profs }, { data: svcs }, { data: ps }] = await Promise.all([
        supabase
          .from('professionals')
          .select('id, name, specialty')
          .eq('salon_id', salon.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true }),
        supabase
          .from('services')
          .select('id, name, price, duration, category')
          .eq('salon_id', salon.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true }),
        supabase.from('professional_services').select('professional_id, service_id'),
      ]);

      const links = (ps || []) as { professional_id: string; service_id: string }[];
      const serviceToProfessional = new Map<string, string>();
      links.forEach((l) => {
        if (!serviceToProfessional.has(l.service_id)) serviceToProfessional.set(l.service_id, l.professional_id);
      });

      setProfessionals((profs || []) as DbProfessional[]);
      setServices(
        ((svcs || []) as any[]).map((s) => ({
          id: s.id,
          name: s.name,
          price: Number(s.price),
          duration: s.duration,
          category: s.category || 'Geral',
          professionalId: serviceToProfessional.get(s.id) || '',
        }))
      );
    } catch (e) {
      console.error('Error loading services admin:', e);
      toast({ title: 'Erro ao carregar serviços', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEdit = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;
    setFormData({
      name: service.name,
      price: String(service.price),
      duration: String(service.duration),
      professionalId: service.professionalId,
      category: service.category,
    });
    setEditingService(serviceId);
    setIsDialogOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!salonId) return;
    try {
      await supabase.from('professional_services').delete().eq('service_id', serviceId);
      const { error } = await supabase.from('services').delete().eq('id', serviceId).eq('salon_id', salonId);
      if (error) throw error;
      toast({ title: 'Serviço removido com sucesso!' });
      await loadAll();
    } catch (e) {
      console.error('Error deleting service:', e);
      toast({ title: 'Erro ao remover serviço', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonId) return;

    try {
      const payload = {
        salon_id: salonId,
        name: formData.name,
        price: Number(formData.price),
        duration: Number(formData.duration),
        category: formData.category || 'Geral',
        is_active: true,
      };

      let serviceId = editingService;

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update({ name: payload.name, price: payload.price, duration: payload.duration, category: payload.category })
          .eq('id', editingService)
          .eq('salon_id', salonId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('services')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        serviceId = data.id;
      }

      // Link professional 
      if (serviceId) {
        await supabase.from('professional_services').delete().eq('service_id', serviceId);
        if (formData.professionalId) {
          const { error } = await supabase.from('professional_services').insert({
            professional_id: formData.professionalId,
            service_id: serviceId,
          });
          if (error) throw error;
        }
      }

      toast({ title: editingService ? 'Serviço atualizado com sucesso!' : 'Serviço criado com sucesso!' });
      resetForm();
      setIsDialogOpen(false);
      await loadAll();
    } catch (e) {
      console.error('Error saving service:', e);
      toast({ title: 'Erro ao salvar serviço', variant: 'destructive' });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-semibold text-foreground">Serviços</h1>
            <p className="text-muted-foreground mt-1">Gerencie os serviços do salão</p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button variant="gradient" className="gap-2" disabled={isLoading}>
                <Plus className="w-4 h-4" />
                Novo Serviço
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Serviço</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Corte Feminino"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="80.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="45"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="professional">Profissional</Label>
                  <Select
                    value={formData.professionalId}
                    onValueChange={(value) => setFormData({ ...formData, professionalId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      {professionals.map((prof) => (
                        <SelectItem key={prof.id} value={prof.id}>
                          {prof.name} {prof.specialty ? `- ${prof.specialty}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" variant="gradient" className="w-full">
                  {editingService ? 'Salvar Alterações' : 'Criar Serviço'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <SubscriptionGate fallbackMessage="Assine o plano PRO para gerenciar seus serviços.">
          <div className="grid gap-4">
            {services.map((service, index) => {
              const professional = service.professionalId ? professionalById.get(service.professionalId) : undefined;

              return (
                <Card
                  key={service.id}
                  className="p-4 border-0 shadow-soft animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                        <span className="text-primary-foreground font-semibold text-lg">
                          {service.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{service.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(service.duration)}
                          </span>
                          {professional && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {professional.name}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                            {service.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-gradient">{formatPrice(service.price)}</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(service.id)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => void handleDelete(service.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </SubscriptionGate>
      </div>
    </AdminLayout>
  );
}

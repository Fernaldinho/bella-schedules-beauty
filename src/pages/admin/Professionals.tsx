import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { SubscriptionGate } from '@/components/SubscriptionGate';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProfessionalForm } from '@/components/admin/ProfessionalForm';
import { Plus, Pencil, Trash2, Link, LayoutDashboard, Check } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';

type UiProfessional = {
  id: string;
  name: string;
  specialty: string;
  photo: string;
  availableDays: number[];
  availableHours: { start: string; end: string };
  services: string[];
};

type UiService = { id: string; name: string };

type DbProfessional = {
  id: string;
  name: string;
  specialty: string | null;
  photo: string | null;
  available_days: number[] | null;
  available_hours: any | null;
};

type DbService = { id: string; name: string };

type LinkRow = { professional_id: string; service_id: string };

export default function Professionals() {
  const navigate = useNavigate();
  const [salonId, setSalonId] = useState<string | null>(null);
  const [salonSlug, setSalonSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [professionals, setProfessionals] = useState<UiProfessional[]>([]);
  const [services, setServices] = useState<UiService[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<UiProfessional | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [professionalToDelete, setProfessionalToDelete] = useState<UiProfessional | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const servicesById = useMemo(() => {
    const map = new Map<string, UiService>();
    services.forEach((s) => map.set(s.id, s));
    return map;
  }, [services]);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setSalonId(null);
        setProfessionals([]);
        setServices([]);
        setLinks([]);
        return;
      }

      const { data: salon, error: salonError } = await supabase
        .from('salons')
        .select('id, slug')
        .eq('owner_id', auth.user.id)
        .maybeSingle();
      if (salonError) throw salonError;
      if (!salon?.id) {
        setSalonId(null);
        setSalonSlug(null);
        setProfessionals([]);
        setServices([]);
        setLinks([]);
        return;
      }
      setSalonId(salon.id);
      setSalonSlug(salon.slug || null);

      const [{ data: profs }, { data: svcs }, { data: ps }] = await Promise.all([
        supabase
          .from('professionals')
          .select('id, name, specialty, photo, available_days, available_hours')
          .eq('salon_id', salon.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true }),
        supabase
          .from('services')
          .select('id, name')
          .eq('salon_id', salon.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true }),
        supabase.from('professional_services').select('professional_id, service_id'),
      ]);

      const linkRows = (ps || []) as LinkRow[];
      const mappedProfessionals: UiProfessional[] = ((profs || []) as DbProfessional[]).map((p) => {
        const availableHours = (p.available_hours as any) || { start: '09:00', end: '18:00' };
        const availableDays = p.available_days || [1, 2, 3, 4, 5, 6];
        const serviceIds = linkRows.filter((l) => l.professional_id === p.id).map((l) => l.service_id);
        return {
          id: p.id,
          name: p.name,
          specialty: p.specialty || '',
          photo: p.photo || '/placeholder.svg',
          availableDays,
          availableHours: { start: availableHours.start || '09:00', end: availableHours.end || '18:00' },
          services: serviceIds,
        };
      });

      setProfessionals(mappedProfessionals);
      setServices(((svcs || []) as DbService[]).map((s) => ({ id: s.id, name: s.name })));
      setLinks(linkRows);
    } catch (e) {
      console.error('Error loading professionals admin:', e);
      toast({ title: 'Erro ao carregar profissionais', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = () => {
    setEditingProfessional(null);
    setFormOpen(true);
  };

  const handleEdit = (professional: UiProfessional) => {
    setEditingProfessional(professional);
    setFormOpen(true);
  };

  const handleDeleteClick = (professional: UiProfessional) => {
    setProfessionalToDelete(professional);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!professionalToDelete || !salonId) return;
    try {
      await supabase.from('professional_services').delete().eq('professional_id', professionalToDelete.id);
      const { error } = await supabase
        .from('professionals')
        .delete()
        .eq('id', professionalToDelete.id)
        .eq('salon_id', salonId);
      if (error) throw error;
      toast({ title: 'Profissional removida com sucesso!' });
      await loadAll();
    } catch (e) {
      console.error('Error deleting professional:', e);
      toast({ title: 'Erro ao remover profissional', variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setProfessionalToDelete(null);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast({ title: 'Link copiado com sucesso!' });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({ title: 'Erro ao copiar link', variant: 'destructive' });
    }
  };

  const getClientLink = (professionalId: string) => {
    const baseUrl = window.location.origin;
    if (salonSlug) {
      return `${baseUrl}/salao/${salonSlug}/profissional/${professionalId}`;
    }
    return `${baseUrl}/salon/${salonId}/professional/${professionalId}`;
  };

  const getDashboardLink = (professionalId: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/profissional/${professionalId}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-semibold text-foreground">Profissionais</h1>
            <p className="text-muted-foreground mt-1">Gerencie a equipe do salão</p>
          </div>
          <Button variant="gradient" onClick={handleAdd} className="gap-2" disabled={isLoading}>
            <Plus className="w-4 h-4" />
            Adicionar Profissional
          </Button>
        </div>

        <SubscriptionGate fallbackMessage="Assine o plano PRO para gerenciar suas profissionais.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {professionals.map((professional, index) => {
              const professionalServices = professional.services
                .map((id) => servicesById.get(id))
                .filter(Boolean) as UiService[];

              return (
                <Card
                  key={professional.id}
                  className="overflow-hidden border-0 shadow-card animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <div className="absolute inset-0 gradient-hero opacity-30" />
                    <img src={professional.photo} alt={professional.name} className="w-full h-full object-cover" />
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
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Serviços ({professionalServices.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {professionalServices.map((service) => (
                          <Badge key={service.id} variant="outline">
                            {service.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Link buttons */}
                    <div className="pt-4 border-t border-border space-y-2">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Ações</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-2"
                          onClick={() => copyToClipboard(getClientLink(professional.id), `client-${professional.id}`)}
                        >
                          {copiedId === `client-${professional.id}` ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Link className="w-4 h-4" />
                          )}
                          Link para clientes
                        </Button>
                        <Button
                          variant="gradient"
                          size="sm"
                          className="flex-1 gap-2"
                          onClick={() => navigate(`/profissional/${professional.id}`)}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Entrar no painel
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

      <ProfessionalForm
        open={formOpen}
        onOpenChange={setFormOpen}
        professional={editingProfessional}
        salonId={salonId}
        services={services}
        onSaved={() => void loadAll()}
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
            <AlertDialogAction
              onClick={() => void handleConfirmDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

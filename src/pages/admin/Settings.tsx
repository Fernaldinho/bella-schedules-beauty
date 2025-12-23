import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { SubscriptionGate } from '@/components/SubscriptionGate';
import { useSalonData } from '@/hooks/useSalonData';
import { useUserInfo } from '@/hooks/useUserInfo';
import { useSubscription } from '@/hooks/useSubscription';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Save, Store, Clock, Palette, Image, Share2, CalendarDays, Star, Globe, User, CreditCard, Loader2, ExternalLink } from 'lucide-react';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { ThemeSelector, appearanceToCustomColors, computeColors, DEFAULT_APPEARANCE } from '@/components/admin/ThemeSelector';
import { ClientPageLinks } from '@/components/admin/ClientPageLinks';
import { SalonAppearance, SocialMedia, SalonStats, ImageFormat } from '@/types/salon';

const WEEK_DAYS = [
  { id: 0, name: 'Domingo' },
  { id: 1, name: 'Segunda' },
  { id: 2, name: 'Terça' },
  { id: 3, name: 'Quarta' },
  { id: 4, name: 'Quinta' },
  { id: 5, name: 'Sexta' },
  { id: 6, name: 'Sábado' },
];

// Apply theme to the DOM
function applyThemeToDOM(appearance: SalonAppearance, priceColor?: string) {
  const computed = computeColors(appearance);
  const root = document.documentElement;

  root.style.setProperty('--primary', computed.buttonBackground);
  root.style.setProperty('--primary-foreground', computed.buttonText);
  root.style.setProperty('--accent', computed.accent);
  root.style.setProperty('--secondary', computed.gradientStart);

  if (priceColor) {
    root.style.setProperty('--price-color', priceColor);
  }

  const gradientPrimary = `linear-gradient(135deg, hsl(${computed.gradientStart}) 0%, hsl(${computed.gradientEnd}) 100%)`;
  root.style.setProperty('--gradient-primary', gradientPrimary);
  root.style.setProperty('--gradient-hero', gradientPrimary);

  root.setAttribute('data-theme-loaded', 'true');
  console.log('[THEME] Applied:', { appearance, computed });
}

export default function Settings() {
  const { salon, isLoading: salonLoading, updateSalon } = useSalonData();
  const { user, subscription: userSubscription, isLoading: userLoading } = useUserInfo();
  const { isActive, openBillingPortal, createCheckout } = useSubscription();
  const [isManaging, setIsManaging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form data (non-appearance fields)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    welcomeText: '',
    whatsapp: '',
    openingStart: '09:00',
    openingEnd: '18:00',
    logoUrl: '',
    logoFormat: 'square' as ImageFormat,
    priceColor: '142 76% 36%',
    socialMedia: { instagram: '', whatsapp: '', facebook: '', tiktok: '' } as SocialMedia,
    workingDays: [1, 2, 3, 4, 5, 6] as number[],
    stats: { rating: '4.9', clientCount: '+500', since: '2020' } as SalonStats,
  });

  // Appearance states: saved (from DB), applied (active on page), draft is managed inside ThemeSelector
  const [appearanceSaved, setAppearanceSaved] = useState<SalonAppearance | null>(null);
  const [appearanceApplied, setAppearanceApplied] = useState<SalonAppearance>(DEFAULT_APPEARANCE);

  // Sync form data with salon data from Supabase
  useEffect(() => {
    if (salon) {
      console.log('[SETTINGS] Syncing form with Supabase data');
      setFormData({
        name: salon.name || '',
        description: salon.description || '',
        welcomeText: salon.welcomeText || '',
        whatsapp: salon.whatsapp || '',
        openingStart: salon.openingHours?.start || '09:00',
        openingEnd: salon.openingHours?.end || '18:00',
        logoUrl: salon.logoUrl || '',
        logoFormat: (salon.logoFormat as ImageFormat) || 'square',
        priceColor: salon.priceColor || '142 76% 36%',
        socialMedia: salon.socialMedia || { instagram: '', whatsapp: '', facebook: '', tiktok: '' },
        workingDays: salon.workingDays || [1, 2, 3, 4, 5, 6],
        stats: salon.stats || { rating: '4.9', clientCount: '+500', since: '2020' },
      });

      // Load appearance from database
      const savedAppearance = salon.appearance as SalonAppearance | null;
      if (savedAppearance) {
        console.log('[SETTINGS] Loaded appearance from DB:', savedAppearance);
        setAppearanceSaved(savedAppearance);
        setAppearanceApplied(savedAppearance);
        applyThemeToDOM(savedAppearance, salon.priceColor || undefined);
      } else {
        // No appearance saved, use default
        setAppearanceSaved(null);
        setAppearanceApplied(DEFAULT_APPEARANCE);
        applyThemeToDOM(DEFAULT_APPEARANCE, salon.priceColor || undefined);
      }
    }
  }, [salon]);

  // Handle "Apply" button from ThemeSelector
  const handleApplyAppearance = (appearance: SalonAppearance) => {
    console.log('[SETTINGS] Applying appearance:', appearance);
    setAppearanceApplied(appearance);
    applyThemeToDOM(appearance, formData.priceColor);
  };

  const handleWorkingDayToggle = (dayId: number) => {
    const current = formData.workingDays;
    if (current.includes(dayId)) {
      setFormData({ ...formData, workingDays: current.filter(d => d !== dayId) });
    } else {
      setFormData({ ...formData, workingDays: [...current, dayId].sort() });
    }
  };

  const handleSocialMediaChange = (field: keyof SocialMedia, value: string) => {
    setFormData({
      ...formData,
      socialMedia: { ...formData.socialMedia, [field]: value }
    });
  };

  const handleStatsChange = (field: keyof SalonStats, value: string) => {
    setFormData({
      ...formData,
      stats: { ...formData.stats, [field]: value }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    console.log('[SETTINGS] Saving to Supabase...');
    console.log('[SETTINGS] Saving appearanceApplied:', appearanceApplied);

    // Convert appearance to customColors for backwards compatibility
    const customColors = appearanceToCustomColors(appearanceApplied);
    
    const success = await updateSalon({
      name: formData.name,
      description: formData.description,
      welcomeText: formData.welcomeText,
      whatsapp: formData.whatsapp,
      openingHours: { start: formData.openingStart, end: formData.openingEnd },
      logoUrl: formData.logoUrl,
      logoFormat: formData.logoFormat,
      themePreset: 'custom',
      customColors: customColors,
      priceColor: formData.priceColor,
      socialMedia: formData.socialMedia,
      workingDays: formData.workingDays,
      stats: formData.stats,
      appearance: appearanceApplied,
    });
    
    setIsSaving(false);
    
    if (success) {
      console.log('[SETTINGS] Saved successfully');
      setAppearanceSaved(appearanceApplied);
      toast({ title: 'Configurações salvas com sucesso!' });
    } else {
      console.error('[SETTINGS] Error saving');
      toast({ 
        title: 'Erro ao salvar', 
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive' 
      });
    }
  };

  const handleManageSubscription = async () => {
    setIsManaging(true);
    try {
      if (isActive) {
        await openBillingPortal();
      } else {
        await createCheckout();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível processar. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsManaging(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const isPageLoading = salonLoading || userLoading;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-semibold text-foreground">Configurações</h1>
            <p className="text-muted-foreground mt-1">Configure as informações do salão</p>
          </div>
          <Card className="p-4 border-0 shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-medium text-foreground">Página do Cliente</span>
            </div>
            <ClientPageLinks />
          </Card>
        </div>

        {/* User Account Section */}
        <Card className="p-6 border-0 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="font-display font-semibold text-lg text-foreground">Minha Conta</h2>
          </div>
          
          {userLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium text-foreground">{user?.name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{user?.email || '-'}</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Subscription Section */}
        <Card className="p-6 border-0 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="font-display font-semibold text-lg text-foreground">Assinatura</h2>
          </div>
          
          {userLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                      {isActive ? 'PRO Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Plano</p>
                  <p className="font-medium text-foreground capitalize">{userSubscription?.plan || 'Free'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Válido até</p>
                  <p className="font-medium text-foreground">{formatDate(userSubscription?.expiresAt || null)}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <Button
                  onClick={handleManageSubscription}
                  disabled={isManaging}
                  variant={isActive ? "outline" : "gradient"}
                  className="gap-2"
                >
                  {isManaging ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  {isActive ? 'Gerenciar Assinatura' : 'Ativar Plano PRO – R$45,30/mês'}
                </Button>
              </div>
            </div>
          )}
        </Card>

        <SubscriptionGate fallbackMessage="Assine o plano PRO para acessar as configurações.">
          {isPageLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
              <Card className="p-6 border-0 shadow-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                    <Store className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h2 className="font-display font-semibold text-lg text-foreground">Informações do Salão</h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Salão</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-elegant" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-elegant resize-none" rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="welcomeText">Texto de Boas-vindas</Label>
                    <Textarea id="welcomeText" value={formData.welcomeText} onChange={(e) => setFormData({ ...formData, welcomeText: e.target.value })} className="input-elegant resize-none" rows={2} placeholder="Agende seu momento de beleza 💖" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-0 shadow-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                    <Image className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h2 className="font-display font-semibold text-lg text-foreground">Logotipo</h2>
                </div>
                <ImageUploader label="Logo do Salão" currentUrl={formData.logoUrl} format={formData.logoFormat} onUrlChange={(url) => setFormData({ ...formData, logoUrl: url })} onFormatChange={(format) => setFormData({ ...formData, logoFormat: format })} />
              </Card>

              <Card className="p-6 border-0 shadow-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h2 className="font-display font-semibold text-lg text-foreground">Estatísticas do Salão</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Esses dados aparecem na página inicial do cliente.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Avaliação (estrelas)</Label>
                    <Input value={formData.stats.rating} onChange={(e) => handleStatsChange('rating', e.target.value)} placeholder="4.9" className="input-elegant" />
                  </div>
                  <div className="space-y-2">
                    <Label>Clientes satisfeitos</Label>
                    <Input value={formData.stats.clientCount} onChange={(e) => handleStatsChange('clientCount', e.target.value)} placeholder="+500" className="input-elegant" />
                  </div>
                  <div className="space-y-2">
                    <Label>Desde quando</Label>
                    <Input value={formData.stats.since} onChange={(e) => handleStatsChange('since', e.target.value)} placeholder="2020" className="input-elegant" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-0 shadow-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                    <Palette className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h2 className="font-display font-semibold text-lg text-foreground">Aparência do Salão</h2>
                </div>
                <ThemeSelector 
                  savedAppearance={appearanceSaved}
                  onApply={handleApplyAppearance}
                />
              </Card>

              <Card className="p-6 border-0 shadow-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h2 className="font-display font-semibold text-lg text-foreground">Redes Sociais</h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Instagram</Label><Input value={formData.socialMedia.instagram} onChange={(e) => handleSocialMediaChange('instagram', e.target.value)} placeholder="@seusalao" className="input-elegant" /></div>
                  <div className="space-y-2"><Label>WhatsApp</Label><Input value={formData.socialMedia.whatsapp} onChange={(e) => handleSocialMediaChange('whatsapp', e.target.value.replace(/\D/g, ''))} placeholder="5511999999999" className="input-elegant" /></div>
                </div>
              </Card>

              <Card className="p-6 border-0 shadow-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h2 className="font-display font-semibold text-lg text-foreground">Dias de Funcionamento</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {WEEK_DAYS.map((day) => (
                    <label
                      key={day.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.workingDays.includes(day.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <Checkbox
                        checked={formData.workingDays.includes(day.id)}
                        onCheckedChange={() => handleWorkingDayToggle(day.id)}
                      />
                      <span className="text-sm font-medium text-foreground">{day.name}</span>
                    </label>
                  ))}
                </div>
              </Card>

              <Card className="p-6 border-0 shadow-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h2 className="font-display font-semibold text-lg text-foreground">Horário de Funcionamento</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="openingStart">Abertura</Label>
                    <Input id="openingStart" type="time" value={formData.openingStart} onChange={(e) => setFormData({ ...formData, openingStart: e.target.value })} className="input-elegant" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="openingEnd">Fechamento</Label>
                    <Input id="openingEnd" type="time" value={formData.openingEnd} onChange={(e) => setFormData({ ...formData, openingEnd: e.target.value })} className="input-elegant" />
                  </div>
                </div>
              </Card>

              <Button type="submit" variant="gradient" size="lg" className="w-full gap-2" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Configurações
              </Button>
            </form>
          )}
        </SubscriptionGate>
      </div>
    </AdminLayout>
  );
}

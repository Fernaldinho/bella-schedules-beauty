import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Scissors, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings,
  Crown,
  ChevronLeft,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSalon } from '@/contexts/SalonContext';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Scissors, label: 'Serviços', path: '/admin/services' },
  { icon: Users, label: 'Profissionais', path: '/admin/professionals' },
  { icon: Calendar, label: 'Agenda', path: '/admin/agenda' },
  { icon: Users, label: 'Clientes', path: '/admin/clients' },
  { icon: BarChart3, label: 'Relatórios', path: '/admin/reports' },
  { icon: Settings, label: 'Configurações', path: '/admin/settings' },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useSalon();
  const { isActive: isSubscribed } = useSubscription();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({ title: 'Você saiu da conta' });
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      toast({ title: 'Erro ao sair', variant: 'destructive' });
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 h-screen bg-card border-r border-border flex flex-col transition-transform duration-300 w-64",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <Crown className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-sm text-foreground truncate">
                {settings.name}
              </h1>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Subscription Badge */}
        <div className="p-4">
          <div className={cn(
            "rounded-xl p-3 text-center text-sm",
            isSubscribed 
              ? "gradient-primary text-primary-foreground" 
              : "bg-muted text-muted-foreground"
          )}>
            {isSubscribed ? (
              <div className="flex items-center justify-center gap-2">
                <Crown className="w-4 h-4" />
                <span className="font-medium">Plano PRO Ativo</span>
              </div>
            ) : (
              <span>Plano Inativo</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                  isActive 
                    ? "gradient-primary text-primary-foreground shadow-soft" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Voltar ao Site</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-destructive hover:text-destructive/80 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export function SidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="lg:hidden"
    >
      <Menu className="w-5 h-5" />
    </Button>
  );
}

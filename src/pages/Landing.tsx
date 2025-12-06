import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Calendar, 
  Users, 
  Palette, 
  BarChart3, 
  ArrowRight,
  Sparkles,
  MessageCircle
} from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Agendamentos Automáticos',
    description: 'Seus clientes agendam online 24h, sem você precisar atender ligações.'
  },
  {
    icon: Users,
    title: 'Gestão de Profissionais',
    description: 'Organize a agenda de cada profissional de forma simples e visual.'
  },
  {
    icon: Palette,
    title: 'Personalização Total',
    description: 'Sua página com suas cores, seu logo e sua identidade.'
  },
  {
    icon: BarChart3,
    title: 'Controle Completo',
    description: 'Acompanhe agendamentos, clientes e receita em um só lugar.'
  }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">AgendaPro</span>
          </div>
          <Link to="/auth">
            <Button variant="gradient" size="lg">
              Entrar / Criar Conta
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-soft" />
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Sistema de Agendamentos</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Automatize os agendamentos do seu salão
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Chega de WhatsApp e planilhas. Deixe seus clientes agendarem online enquanto você foca no que importa: atender bem.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/auth">
                <Button variant="hero" size="xl" className="group w-full sm:w-auto">
                  Começar Agora
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Sistema completo para gerenciar seu salão, barbearia, clínica de estética ou pet shop.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.title}
                className="p-6 border-0 shadow-card hover:shadow-glow transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="glass-card rounded-3xl p-8 md:p-12 max-w-4xl mx-auto text-center">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-foreground mb-4">
              Pronto para automatizar seu negócio?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Crie sua conta gratuita e comece a receber agendamentos online hoje mesmo.
            </p>
            <Link to="/auth">
              <Button variant="hero" size="xl">
                <Calendar className="w-5 h-5 mr-2" />
                Criar Minha Conta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-semibold text-foreground">AgendaPro</span>
            </div>
            
            <a
              href="https://wa.me/5522997946175"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>(22) 99794-6175</span>
            </a>
            
            <p className="text-sm text-muted-foreground">
              © 2024 AgendaPro. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

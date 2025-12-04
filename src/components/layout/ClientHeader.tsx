import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Instagram, MessageCircle, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSalon } from '@/contexts/SalonContext';
import { cn } from '@/lib/utils';

export function ClientHeader() {
  const { settings } = useSalon();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const socialLinks = [
    { 
      name: 'Instagram', 
      url: settings.socialMedia?.instagram ? `https://instagram.com/${settings.socialMedia.instagram.replace('@', '')}` : '', 
      icon: Instagram,
      show: !!settings.socialMedia?.instagram 
    },
    { 
      name: 'WhatsApp', 
      url: settings.socialMedia?.whatsapp ? `https://wa.me/${settings.socialMedia.whatsapp.replace(/\D/g, '')}` : '', 
      icon: MessageCircle,
      show: !!settings.socialMedia?.whatsapp 
    },
    { 
      name: 'Facebook', 
      url: settings.socialMedia?.facebook || '', 
      icon: Facebook,
      show: !!settings.socialMedia?.facebook 
    },
  ].filter(link => link.show);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.name}
                className={cn(
                  "h-10 object-contain",
                  settings.logoFormat === 'circular' && "rounded-full",
                  settings.logoFormat === 'square' && "rounded-lg"
                )}
              />
            ) : (
              <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-lg">
                  {settings.name.charAt(0)}
                </span>
              </div>
            )}
            <span className="font-display font-semibold text-foreground hidden sm:block">
              {settings.name}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title={link.name}
              >
                <link.icon className="w-5 h-5" />
              </a>
            ))}
            <Button asChild variant="gradient" size="sm">
              <Link to="/admin">Área Admin</Link>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              {socialLinks.length > 0 && (
                <div className="flex items-center gap-4 px-2">
                  {socialLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title={link.name}
                    >
                      <link.icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              )}
              <Button asChild variant="gradient" className="w-full">
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                  Área Admin
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

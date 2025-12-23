import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Eye, Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function ClientPageLinks() {
  const [salonId, setSalonId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSalonId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('salons')
        .select('slug')
        .eq('owner_id', user.id)
        .single();

      if (data?.slug) {
        setSalonId(data.slug);
      }
    };

    fetchSalonId();
  }, []);

  const getClientPageUrl = () => {
    if (!salonId) return '';
    return `${window.location.origin}/salao/${salonId}`;
  };

  const handleViewPage = () => {
    const url = getClientPageUrl();
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleCopyLink = async () => {
    const url = getClientPageUrl();
    if (url) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: 'Link copiado!' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!salonId) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleViewPage}
        className="gap-2"
      >
        <Eye className="w-4 h-4 text-primary" />
        Ver página
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="gap-2"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
        Copiar link
      </Button>
    </div>
  );
}

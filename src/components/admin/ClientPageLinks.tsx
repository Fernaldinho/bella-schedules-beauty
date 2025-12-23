import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Copy, Check, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useSalonData } from '@/hooks/useSalonData';

export function ClientPageLinks() {
  const { salon, isLoading } = useSalonData();
  const [copied, setCopied] = useState(false);

  const salonSlug = salon?.slug || '';

  const clientPageUrl = useMemo(() => {
    if (!salonSlug) return '';
    return `${window.location.origin}/salao/${salonSlug}`;
  }, [salonSlug]);

  const handleViewPage = () => {
    if (!clientPageUrl) return;
    window.open(clientPageUrl, '_blank');
  };

  const handleCopyLink = async () => {
    if (!clientPageUrl) return;
    await navigator.clipboard.writeText(clientPageUrl);
    setCopied(true);
    toast({ title: 'Link copiado!' });
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando link...
      </div>
    );
  }

  if (!salonSlug) return null;

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleViewPage} className="gap-2">
        <Eye className="w-4 h-4 text-primary" />
        Ver página
      </Button>
      <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-2">
        {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
        Copiar link
      </Button>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export function RequireAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session);
      setIsChecking(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthed(!!session);
      setIsChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isChecking && !isAuthed) {
      navigate('/auth', { replace: true, state: { from: location.pathname } });
    }
  }, [isChecking, isAuthed, navigate, location.pathname]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthed) return null;

  return <Outlet />;
}

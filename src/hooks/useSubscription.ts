import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionState {
  isActive: boolean;
  isLoading: boolean;
  plan: string | null;
  expiresAt: string | null;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionState>({
    isActive: false,
    isLoading: true,
    plan: null,
    expiresAt: null,
  });

  const checkSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubscription({ isActive: false, isLoading: false, plan: null, expiresAt: null });
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        setSubscription({ isActive: false, isLoading: false, plan: null, expiresAt: null });
        return;
      }

      const isActive = data.status === 'active';
      setSubscription({
        isActive,
        isLoading: false,
        plan: data.plan,
        expiresAt: data.current_period_end,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription({ isActive: false, isLoading: false, plan: null, expiresAt: null });
    }
  };

  const createCheckout = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkSubscription();

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => authSubscription.unsubscribe();
  }, []);

  return {
    ...subscription,
    checkSubscription,
    createCheckout,
  };
}

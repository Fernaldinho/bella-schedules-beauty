import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionState {
  isActive: boolean;
  isLoading: boolean;
  plan: string;
  status: string;
  expiresAt: string | null;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionState>({
    isActive: false,
    isLoading: true,
    plan: 'free',
    status: 'inactive',
    expiresAt: null,
  });

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setSubscription({ 
          isActive: false, 
          isLoading: false, 
          plan: 'free', 
          status: 'inactive',
          expiresAt: null 
        });
        return;
      }

      // Call the subscription-check edge function
      const { data, error } = await supabase.functions.invoke('subscription-check', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        setSubscription({ 
          isActive: false, 
          isLoading: false, 
          plan: 'free', 
          status: 'inactive',
          expiresAt: null 
        });
        return;
      }

      setSubscription({
        isActive: data?.isActive || false,
        isLoading: false,
        plan: data?.plan || 'free',
        status: data?.status || 'inactive',
        expiresAt: data?.expiresAt || null,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription({ 
        isActive: false, 
        isLoading: false, 
        plan: 'free', 
        status: 'inactive',
        expiresAt: null 
      });
    }
  }, []);

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
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      throw error;
    }
  };

  const openBillingPortal = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkSubscription();

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => authSubscription.unsubscribe();
  }, [checkSubscription]);

  return {
    ...subscription,
    checkSubscription,
    createCheckout,
    openBillingPortal,
  };
}

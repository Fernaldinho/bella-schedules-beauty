import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserInfo {
  id: string;
  email: string;
  name: string;
}

interface SubscriptionInfo {
  isActive: boolean;
  plan: string;
  status: string;
  expiresAt: string | null;
  stripeCustomerId: string | null;
}

interface SalonInfo {
  id: string;
  name: string;
}

interface UserInfoState {
  user: UserInfo | null;
  subscription: SubscriptionInfo | null;
  salon: SalonInfo | null;
  isLoading: boolean;
  error: string | null;
}

export function useUserInfo() {
  const [state, setState] = useState<UserInfoState>({
    user: null,
    subscription: null,
    salon: null,
    isLoading: true,
    error: null,
  });

  const fetchUserInfo = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setState({
          user: null,
          subscription: null,
          salon: null,
          isLoading: false,
          error: null,
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('user-info', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      setState({
        user: data?.user || null,
        subscription: data?.subscription || null,
        salon: data?.salon || null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching user info:', error);
      setState({
        user: null,
        subscription: null,
        salon: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, []);

  useEffect(() => {
    fetchUserInfo();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserInfo();
    });

    return () => subscription.unsubscribe();
  }, [fetchUserInfo]);

  return {
    ...state,
    refetch: fetchUserInfo,
  };
}

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

interface Profile {
  id: string;
  tenant_id: string | null;
  role?: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface Tenant {
  id: string;
  name: string;
  logo_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  tenant: Tenant | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  tenant: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef<NodeJS.Timeout>();
  const queryClient = useQueryClient();
  
  // Session timeout: 2 hours of inactivity (better for mobile)
  const SESSION_TIMEOUT = 2 * 60 * 60 * 1000;

  // Charger profil, tenant ET rôle en une seule requête optimisée
  const { data: profileData } = useQuery({
    queryKey: ['profile-with-tenant-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return { profile: null, tenant: null };
      
      // Requête parallèle: profil+rôle ET tenant en même temps
      const profilePromise = supabase
        .rpc('get_profiles_with_roles')
        .eq('id', user.id)
        .maybeSingle();

      const { data: profilesData, error: profileError } = await profilePromise;

      if (profileError) {
        logger.error('Error loading profile:', profileError);
        throw profileError;
      }

      if (!profilesData) {
        logger.warn('No profile found for user:', user.id);
        return { profile: null, tenant: null };
      }

      // Charger le tenant en parallèle seulement si nécessaire
      let tenant = null;
      if (profilesData.tenant_id) {
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('id, name, logo_url')
          .eq('id', profilesData.tenant_id)
          .maybeSingle();
        tenant = tenantData;
      }
      
      return {
        profile: profilesData as Profile,
        tenant: tenant as Tenant | null
      };
    },
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000, // 30 min - le profil change rarement
    gcTime: 60 * 60 * 1000, // 1h
  });

  const profile = profileData?.profile ?? null;
  const tenant = profileData?.tenant ?? null;

  // Check if user or tenant is deactivated and force sign out
  useEffect(() => {
    if (!user?.id || !profile) return;

    const checkActiveStatus = async () => {
      const { data, error } = await supabase.rpc('check_user_active', { p_user_id: user.id });
      
      if (error || !data || data.length === 0) return;

      const status = data[0];
      
      if (!status.user_active) {
        logger.warn('User account is deactivated, signing out');
        toast.error('Compte désactivé', {
          description: 'Votre compte utilisateur a été désactivé. Contactez votre administrateur.',
          duration: 8000,
        });
        await supabase.auth.signOut();
        return;
      }

      if (!status.tenant_active) {
        logger.warn('Tenant is deactivated, signing out');
        toast.error('Entreprise désactivée', {
          description: `L'entreprise "${status.tenant_name}" a été désactivée. Contactez l'administrateur.`,
          duration: 8000,
        });
        await supabase.auth.signOut();
        return;
      }
    };

    checkActiveStatus();
  }, [user?.id, profile]);

  // Reset inactivity timer on user activity
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    if (session) {
      inactivityTimerRef.current = setTimeout(async () => {
        logger.info('Session timeout due to inactivity');
        await supabase.auth.signOut();
      }, SESSION_TIMEOUT);
    }
  };

  // Monitor user activity
  useEffect(() => {
    if (!session) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer);
    });

    resetInactivityTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [session]);

  useEffect(() => {
    // Vérifier la session d'abord
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Puis écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('Auth state changed:', event);
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Gérer les différents événements
      if (event === 'SIGNED_OUT') {
        queryClient.clear();
        logger.info('Cache cleared due to logout');
      } else if (event === 'TOKEN_REFRESHED') {
        logger.info('Token refreshed successfully');
      } else if (event === 'USER_UPDATED') {
        logger.info('User data updated');
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Écouter les changements de rôles en temps réel
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('user-role-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          logger.info('Role changed, invalidating cache and refetching profile');
          
          // Invalider le cache du profil pour forcer un rechargement
          queryClient.invalidateQueries({ queryKey: ['profile-with-tenant-role'] });
          
          // Afficher un message à l'utilisateur
          toast.info('Votre rôle a été modifié', {
            description: 'Rechargement de la page pour appliquer les changements...',
            duration: 3000,
          });
          
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return (
    <AuthContext.Provider value={{ user, session, profile: profile ?? null, tenant: tenant ?? null, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

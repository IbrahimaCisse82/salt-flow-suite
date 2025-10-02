import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';

interface Profile {
  id: string;
  tenant_id: string;
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
  
  // Session timeout: 30 minutes of inactivity
  const SESSION_TIMEOUT = 30 * 60 * 1000;

  // Charger profil, tenant ET rôle en une seule requête optimisée via la fonction get_profiles_with_roles
  const { data: profileData } = useQuery({
    queryKey: ['profile-with-tenant-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return { profile: null, tenant: null };
      
      // Utiliser la fonction RPC qui retourne profile + role en une seule requête
      const { data: profilesData, error: profileError } = await supabase
        .rpc('get_profiles_with_roles')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Charger le tenant séparément (nécessaire car pas inclus dans get_profiles_with_roles)
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name, logo_url')
        .eq('id', profilesData.tenant_id)
        .single();

      if (tenantError) throw tenantError;
      
      return {
        profile: profilesData as Profile,
        tenant: tenant as Tenant
      };
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const profile = profileData?.profile ?? null;
  const tenant = profileData?.tenant ?? null;

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
    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Vider le cache React Query lors de la déconnexion
      if (event === 'SIGNED_OUT') {
        queryClient.clear();
        logger.info('Cache cleared due to logout');
      }
    });

    // Vérifier la session au démarrage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ user, session, profile: profile ?? null, tenant: tenant ?? null, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';

interface Profile {
  id: string;
  tenant_id: string;
  role?: string; // Populated from user_roles join
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

  // Charger profil et tenant en une seule requête optimisée
  const { data: profileData } = useQuery({
    queryKey: ['profile-with-tenant', user?.id],
    queryFn: async () => {
      if (!user?.id) return { profile: null, tenant: null };
      
      // Charger le profil avec le tenant en une seule requête
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          tenant:tenants!profiles_tenant_id_fkey(
            id,
            name,
            logo_url
          )
        `)
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Fetch user role from user_roles table
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .order('role')
        .limit(1)
        .maybeSingle();
      
      return {
        profile: { ...profile, role: roleData?.role || undefined } as Profile,
        tenant: profile.tenant as Tenant
      };
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // Cache pendant 10 minutes
    gcTime: 15 * 60 * 1000, // Garde en mémoire 15 minutes
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

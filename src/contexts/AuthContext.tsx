import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

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

  useEffect(() => {
    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Vérifier la session au démarrage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile: profile ?? null, tenant: tenant ?? null, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

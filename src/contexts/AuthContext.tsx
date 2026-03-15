import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useActiveStatusCheck } from '@/hooks/useActiveStatusCheck';
import { useRoleListener } from '@/hooks/useRoleListener';

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
  const queryClient = useQueryClient();

  // ── Profile + Tenant query ──────────────────────────────
  const { data: profileData } = useQuery({
    queryKey: ['profile-with-tenant-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return { profile: null, tenant: null };

      const { data: profilesData, error: profileError } = await supabase
        .rpc('get_profiles_with_roles')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        logger.error('Error loading profile:', profileError);
        throw profileError;
      }
      if (!profilesData) {
        logger.warn('No profile found for user:', user.id);
        return { profile: null, tenant: null };
      }

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
        tenant: tenant as Tenant | null,
      };
    },
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const profile = profileData?.profile ?? null;
  const tenant = profileData?.tenant ?? null;

  // ── Extracted hooks ─────────────────────────────────────
  useSessionTimeout(session);
  useActiveStatusCheck(user?.id, !!profile);
  useRoleListener(user?.id);

  // ── Auth state listener ─────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('Auth state changed:', event);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === 'SIGNED_OUT') {
        queryClient.clear();
        logger.info('Cache cleared due to logout');
      } else if (event === 'TOKEN_REFRESHED') {
        logger.info('Token refreshed successfully');
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ user, session, profile, tenant, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

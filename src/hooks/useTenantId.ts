import { useAuth } from '@/contexts/AuthContext';

/**
 * Centralized hook to get the current user's tenant_id
 * Prevents race conditions and ensures consistent tenant_id retrieval
 */
export const useTenantId = (): string | null => {
  const { profile } = useAuth();
  return profile?.tenant_id ?? null;
};

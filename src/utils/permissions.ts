// Définition des permissions par rôle
export type UserRole = 'gerant' | 'commercial' | 'production' | 'comptable' | 'admin';

export const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    '/',
    '/admin/tenants',
    '/admin/chart-of-accounts',
    '/parametres'
  ],
  gerant: [
    '/',
    '/bassins',
    '/campagne',
    '/production',
    '/stocks',
    '/equipes',
    '/commercial',
    '/comptabilite',
    '/rapports',
    '/parametres',
    '/utilisateurs'
  ],
  commercial: [
    '/',
    '/commercial',
    '/parametres'
  ],
  comptable: [
    '/',
    '/comptabilite',
    '/parametres'
  ],
  production: [
    '/',
    '/bassins',
    '/production',
    '/stocks',
    '/equipes',
    '/parametres'
  ]
};

export const hasAccessToPage = (userRole: UserRole | null, page: string): boolean => {
  if (!userRole) return false;
  return rolePermissions[userRole]?.includes(page) || false;
};

export const getAccessiblePages = (userRole: UserRole | null): string[] => {
  if (!userRole) return [];
  return rolePermissions[userRole] || [];
};

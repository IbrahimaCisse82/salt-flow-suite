// Définition des permissions par rôle
export type UserRole = 'gerant' | 'commercial' | 'production' | 'comptable' | 'admin';

export const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    '/admin',
    '/admin/tenants',
    '/admin/users',
    '/admin/roles',
    '/admin/chart-of-accounts',
    '/admin/expense-types',
    '/admin/monitoring',
    '/admin/audit-logs',
    '/admin/settings',
    '/admin/email-templates',
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
    '/comptabilite/grand-livre',
    '/comptabilite/rapprochement',
    '/comptabilite/operations-diverses',
    '/comptabilite/cloture',
    '/comptabilite/immobilisations',
    '/achats',
    '/rapports',
    '/parametres',
    '/utilisateurs'
  ],
  commercial: [
    '/',
    '/commercial',
    '/rapports',
    '/parametres'
  ],
  comptable: [
    '/',
    '/comptabilite',
    '/comptabilite/grand-livre',
    '/comptabilite/rapprochement',
    '/comptabilite/operations-diverses',
    '/comptabilite/cloture',
    '/comptabilite/immobilisations',
    '/campagne',
    '/achats',
    '/rapports',
    '/parametres'
  ],
  production: [
    '/',
    '/bassins',
    '/campagne',
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

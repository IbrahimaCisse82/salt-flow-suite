// Définition des permissions par rôle
// Les valeurs correspondent exactement à l'enum app_role de la base de données
export type UserRole =
  | 'gerant'
  | 'chef_production'
  | 'commercial'
  | 'comptable'
  | 'admin'
  | 'rh'
  | 'magasinier'
  | 'qualite';

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
  chef_production: [
    '/',
    '/bassins',
    '/campagne',
    '/production',
    '/stocks',
    '/equipes',
    '/parametres'
  ],
  rh: [
    '/',
    '/equipes',
    '/parametres'
  ],
  magasinier: [
    '/',
    '/stocks',
    '/parametres'
  ],
  qualite: [
    '/',
    '/production',
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

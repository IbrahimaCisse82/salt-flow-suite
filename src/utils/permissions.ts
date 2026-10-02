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
    '/comptabilite/liasse',
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
    '/comptabilite/liasse',
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

/** Rôles multiples : UNION des droits (Lot 1.3). Accepte un rôle ou une liste. */
export const hasAccessToPage = (userRole: UserRole | UserRole[] | null | undefined, page: string): boolean => {
  const roles = Array.isArray(userRole) ? userRole : userRole ? [userRole] : [];
  return roles.some((r) => rolePermissions[r]?.includes(page));
};

export const getAccessiblePages = (userRole: UserRole | UserRole[] | null | undefined): string[] => {
  const roles = Array.isArray(userRole) ? userRole : userRole ? [userRole] : [];
  return [...new Set(roles.flatMap((r) => rolePermissions[r] || []))];
};

/** Liste des rôles effectifs d'un profil (tous ses rôles, sinon le rôle principal). */
export const profileRoles = (profile: { role?: string | null; roles?: string[] | null } | null | undefined): UserRole[] =>
  ((profile?.roles?.length ? profile.roles : profile?.role ? [profile.role] : []) as UserRole[]);

/** Rôles autorisés à voir les coûts et valeurs de stock (CMP). */
export const canSeeStockCosts = (roles: string[]): boolean =>
  roles.some((r) => ['admin', 'gerant', 'comptable', 'magasinier'].includes(r));

/** Rôles autorisés à voir les rapports financiers (trésorerie, rentabilité). */
export const canSeeFinancialReports = (roles: string[]): boolean =>
  roles.some((r) => ['admin', 'gerant', 'comptable'].includes(r));

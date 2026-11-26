import { describe, it, expect } from 'vitest';
import { hasAccessToPage } from '../permissions';

type R = 'admin'|'gerant'|'comptable'|'commercial'|'chef_production'|'rh'|'magasinier'|'qualite';
const roles: R[] = ['admin','gerant','comptable','commercial','chef_production','rh','magasinier','qualite'];
// Matrice du cahier des charges v3 §2.2 (✅ = rôles autorisés)
const matrix: Record<string, R[]> = {
  '/bassins': ['gerant','chef_production'],
  '/campagne': ['gerant','comptable','chef_production'],
  '/production': ['gerant','chef_production','qualite'],
  '/stocks': ['gerant','chef_production','magasinier'],
  '/equipes': ['gerant','chef_production','rh'],
  '/commercial': ['gerant','commercial'],
  '/comptabilite': ['gerant','comptable'],
  '/comptabilite/grand-livre': ['gerant','comptable'],
  '/comptabilite/cloture': ['gerant','comptable'],
  '/rapports': ['gerant','comptable','commercial'],
  '/utilisateurs': ['gerant'],
  '/parametres': roles,
  '/admin': ['admin'],
  '/admin/tenants': ['admin'],
  '/admin/audit-logs': ['admin'],
};
describe('Matrice des accès §2.2', () => {
  for (const [path, allowed] of Object.entries(matrix)) {
    for (const role of roles) {
      const expected = allowed.includes(role);
      it(`${role} ${expected ? 'accède à' : 'est refusé sur'} ${path}`, () => {
        expect(hasAccessToPage([role] as never, path)).toBe(expected);
      });
    }
  }
});

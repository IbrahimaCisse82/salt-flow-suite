import { describe, it, expect } from 'vitest';
import { toUserMessage } from '../userErrors';

describe('toUserMessage', () => {
  it('RLS', () => expect(toUserMessage({ message: 'new row violates row-level security policy for table "sales"' })).toMatch(/droits/));
  it('doublon', () => expect(toUserMessage({ message: 'duplicate key value violates unique constraint "x"', code: '23505' })).toBe('Cet enregistrement existe déjà.'));
  it('clé étrangère', () => expect(toUserMessage({ code: '23503', message: 'foreign key violation' })).toMatch(/liés?/));
  it('réseau', () => expect(toUserMessage(new TypeError('Failed to fetch'))).toMatch(/Connexion/));
  it('session', () => expect(toUserMessage('JWT expired')).toMatch(/session/));
  it('message métier français conservé', () => {
    expect(toUserMessage({ message: 'Stock insuffisant : un stock négatif est interdit' })).toBe('Stock insuffisant : un stock négatif est interdit');
    expect(toUserMessage({ message: 'Réserve légale insuffisante : minimum 100000 FCFA' })).toMatch(/Réserve légale/);
  });
  it('erreur technique inconnue -> message générique', () => {
    expect(toUserMessage({ message: 'TypeError: x is undefined at foo (bar.js:1)' })).toMatch(/erreur est survenue/);
  });
  it('vide -> fallback', () => expect(toUserMessage(null)).toMatch(/erreur est survenue/));
});

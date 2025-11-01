import { describe, it, expect } from 'vitest';
import { hasAccessToPage, getAccessiblePages, UserRole } from '../permissions';

describe('Permissions Utils', () => {
  describe('hasAccessToPage', () => {
    it('should allow admin to access admin pages', () => {
      expect(hasAccessToPage('admin', '/admin')).toBe(true);
      expect(hasAccessToPage('admin', '/admin/tenants')).toBe(true);
      expect(hasAccessToPage('admin', '/admin/users')).toBe(true);
    });

    it('should not allow gerant to access admin pages', () => {
      expect(hasAccessToPage('gerant', '/admin')).toBe(false);
      expect(hasAccessToPage('gerant', '/admin/tenants')).toBe(false);
    });

    it('should allow gerant to access tenant pages', () => {
      expect(hasAccessToPage('gerant', '/')).toBe(true);
      expect(hasAccessToPage('gerant', '/bassins')).toBe(true);
      expect(hasAccessToPage('gerant', '/production')).toBe(true);
      expect(hasAccessToPage('gerant', '/commercial')).toBe(true);
    });

    it('should restrict commercial role correctly', () => {
      expect(hasAccessToPage('commercial', '/')).toBe(true);
      expect(hasAccessToPage('commercial', '/commercial')).toBe(true);
      expect(hasAccessToPage('commercial', '/production')).toBe(false);
      expect(hasAccessToPage('commercial', '/comptabilite')).toBe(false);
    });

    it('should restrict production role correctly', () => {
      expect(hasAccessToPage('production', '/')).toBe(true);
      expect(hasAccessToPage('production', '/production')).toBe(true);
      expect(hasAccessToPage('production', '/bassins')).toBe(true);
      expect(hasAccessToPage('production', '/commercial')).toBe(false);
      expect(hasAccessToPage('production', '/comptabilite')).toBe(false);
    });

    it('should restrict comptable role correctly', () => {
      expect(hasAccessToPage('comptable', '/')).toBe(true);
      expect(hasAccessToPage('comptable', '/comptabilite')).toBe(true);
      expect(hasAccessToPage('comptable', '/production')).toBe(false);
      expect(hasAccessToPage('comptable', '/commercial')).toBe(false);
    });

    it('should return false for null role', () => {
      expect(hasAccessToPage(null, '/')).toBe(false);
      expect(hasAccessToPage(null, '/admin')).toBe(false);
    });
  });

  describe('getAccessiblePages', () => {
    it('should return correct pages for admin', () => {
      const pages = getAccessiblePages('admin');
      expect(pages).toContain('/admin');
      expect(pages).toContain('/admin/tenants');
      expect(pages.length).toBeGreaterThan(0);
    });

    it('should return correct pages for gerant', () => {
      const pages = getAccessiblePages('gerant');
      expect(pages).toContain('/');
      expect(pages).toContain('/bassins');
      expect(pages).toContain('/production');
      expect(pages).not.toContain('/admin');
    });

    it('should return empty array for null role', () => {
      const pages = getAccessiblePages(null);
      expect(pages).toEqual([]);
    });
  });
});

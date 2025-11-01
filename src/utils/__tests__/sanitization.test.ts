import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  sanitizeRichText,
  stripAllHtml,
  sanitizeAttribute,
  sanitizeCss,
} from '../sanitization';

describe('Sanitization Utilities', () => {
  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const output = sanitizeHtml(input);
      expect(output).toContain('<p>');
      expect(output).toContain('<strong>');
    });

    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('<script>');
      expect(output).not.toContain('alert');
    });

    it('should remove onclick handlers', () => {
      const input = '<p onclick="alert(1)">Click me</p>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('onclick');
    });

    it('should allow safe links', () => {
      const input = '<a href="https://example.com">Link</a>';
      const output = sanitizeHtml(input);
      expect(output).toContain('<a');
      expect(output).toContain('href');
    });

    it('should remove javascript: URLs', () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('javascript:');
    });
  });

  describe('sanitizeRichText', () => {
    it('should allow more HTML tags for rich content', () => {
      const input = '<h1>Title</h1><table><tr><td>Cell</td></tr></table>';
      const output = sanitizeRichText(input);
      expect(output).toContain('<h1>');
      expect(output).toContain('<table>');
    });

    it('should allow images with safe attributes', () => {
      const input = '<img src="https://example.com/image.jpg" alt="Test">';
      const output = sanitizeRichText(input);
      expect(output).toContain('<img');
      expect(output).toContain('src');
    });

    it('should still remove scripts', () => {
      const input = '<h1>Title</h1><script>alert("xss")</script>';
      const output = sanitizeRichText(input);
      expect(output).not.toContain('<script>');
    });
  });

  describe('stripAllHtml', () => {
    it('should remove all HTML tags', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const output = stripAllHtml(input);
      expect(output).toBe('Hello World');
    });

    it('should remove scripts and their content', () => {
      const input = '<p>Safe</p><script>alert("xss")</script>';
      const output = stripAllHtml(input);
      expect(output).not.toContain('<script>');
      expect(output).not.toContain('alert');
    });

    it('should handle empty input', () => {
      expect(stripAllHtml('')).toBe('');
    });
  });

  describe('sanitizeAttribute', () => {
    it('should escape HTML entities', () => {
      const input = '<script>alert("xss")</script>';
      const output = sanitizeAttribute(input);
      expect(output).toContain('&lt;');
      expect(output).toContain('&gt;');
      expect(output).not.toContain('<');
      expect(output).not.toContain('>');
    });

    it('should escape quotes', () => {
      const input = 'Test "quotes" and \'apostrophes\'';
      const output = sanitizeAttribute(input);
      expect(output).toContain('&quot;');
      expect(output).toContain('&#x27;');
    });

    it('should escape ampersands', () => {
      const input = 'Tom & Jerry';
      const output = sanitizeAttribute(input);
      expect(output).toContain('&amp;');
    });
  });

  describe('sanitizeCss', () => {
    it('should remove javascript: URLs', () => {
      const input = 'background: url(javascript:alert(1))';
      const output = sanitizeCss(input);
      expect(output).not.toContain('javascript:');
    });

    it('should remove expression()', () => {
      const input = 'width: expression(alert(1))';
      const output = sanitizeCss(input);
      expect(output).not.toContain('expression(');
    });

    it('should allow safe CSS', () => {
      const input = 'color: red; font-size: 16px;';
      const output = sanitizeCss(input);
      expect(output).toBe(input);
    });
  });
});

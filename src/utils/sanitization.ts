// SECURITY: HTML Sanitization utilities
// Use DOMPurify for sanitizing user-generated HTML content

import DOMPurify from 'dompurify';

/**
 * SECURITY: Sanitize HTML content to prevent XSS attacks
 * ONLY use this when you absolutely need to render user HTML
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i,
  });
}

/**
 * SECURITY: Sanitize HTML but allow more tags for rich text editors
 */
export function sanitizeRichText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'b', 'i', 'em', 'strong', 'u', 's', 'mark',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'width', 'height'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i,
  });
}

/**
 * SECURITY: Strip ALL HTML tags
 */
export function stripAllHtml(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * SECURITY: Sanitize for use in HTML attributes
 */
export function sanitizeAttribute(value: string): string {
  return value
    .replace(/[<>"'&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return entities[char] || char;
    });
}

/**
 * SECURITY: Sanitize CSS values (for style attributes)
 */
export function sanitizeCss(cssValue: string): string {
  // Remove any potentially dangerous CSS
  const dangerous = /javascript:|expression\(|behaviour:|binding:|vbscript:|mocha:|livescript:/gi;
  return cssValue.replace(dangerous, '');
}

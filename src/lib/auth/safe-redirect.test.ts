import { describe, expect, it } from 'vitest';
import { sanitizeRedirectPath } from './safe-redirect';

describe('sanitizeRedirectPath', () => {
  it('allows normal in-app paths', () => {
    expect(sanitizeRedirectPath('/feed')).toBe('/feed');
    expect(sanitizeRedirectPath('/feed/familias?tab=mine')).toBe('/feed/familias?tab=mine');
  });

  it('blocks protocol-relative and external redirects', () => {
    expect(sanitizeRedirectPath('//evil.com')).toBe('/feed');
    expect(sanitizeRedirectPath('https://evil.com')).toBe('/feed');
    expect(sanitizeRedirectPath('/\\evil.com')).toBe('/feed');
  });

  it('falls back when redirect is missing or blank', () => {
    expect(sanitizeRedirectPath(null)).toBe('/feed');
    expect(sanitizeRedirectPath('')).toBe('/feed');
    expect(sanitizeRedirectPath('   ')).toBe('/feed');
  });

  it('uses a custom fallback', () => {
    expect(sanitizeRedirectPath('//evil.com', '/login')).toBe('/login');
  });
});

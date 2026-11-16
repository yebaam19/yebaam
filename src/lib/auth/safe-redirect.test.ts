import { describe,expect,it } from 'vitest';
import { sanitizeRedirectPath } from './safe-redirect';

describe('sanitizeRedirectPath', () => {
  it('allows normal in-app paths', () => {
    expect(sanitizeRedirectPath('/feed')).toBe('/feed');
    expect(sanitizeRedirectPath('/familias?tab=mine')).toBe('/familias?tab=mine');
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

describe('approved destinations', () => {
  it.each(['/index.php', '/api/auth/session', '/login', '/auth/callback', '/_next/x', '/%2f%2fevil.com', '/feed/%5cevil', '/feed/%252e%252e/api'])('rejects %s', (path) => {
    expect(sanitizeRedirectPath(path, '/rejected')).toBe('/rejected');
  });
  it('keeps legitimate nested links and queries', () => {
    expect(sanitizeRedirectPath('/umbral?clave=synthetic#door')).toBe('/umbral?clave=synthetic#door');
    expect(sanitizeRedirectPath('/cities/synthetic/news')).toBe('/cities/synthetic/news');
  });
});

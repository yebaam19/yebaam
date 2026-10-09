import { describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { proxy } from '@/proxy';

vi.mock('@/utils/supabase/claims', () => ({
  getAuthClaimsUser: vi.fn().mockResolvedValue({ user: null, error: null }),
}));
vi.mock('@/utils/supabase/middleware', () => ({
  createClient: () => ({
    supabase: {},
    supabaseResponse: NextResponse.next(),
    clearAuthCookies: vi.fn(),
  }),
  isAnonymousSessionError: () => false,
  isInvalidRefreshTokenError: () => false,
  redirectWithCookies: (url: URL) => NextResponse.redirect(url),
}));

describe('public community routes', () => {
  it.each(['/feed/comunidades', '/feed/comunidades/una-comunidad/fotos'])(
    'lets a visitor read %s without a login redirect', async (path) => {
      const response = await proxy(new NextRequest(`http://localhost:3000${path}`));
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    },
  );

  it('keeps unrelated feed routes behind login', async () => {
    const response = await proxy(new NextRequest('http://localhost:3000/feed'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login?redirect=%2Ffeed');
  });
});

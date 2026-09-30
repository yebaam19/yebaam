import { afterEach, describe, expect, it, vi } from 'vitest';

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient }));

import { getPublicServerClient } from './public-server';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('public server client', () => {
  it('uses only the publishable key, with no cookies, persisted session or browser auth', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'public-test-key');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'must-never-be-used');
    getPublicServerClient();
    expect(createClient).toHaveBeenCalledExactlyOnceWith(
      'https://example.supabase.co', 'public-test-key', {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      },
    );
  });
});

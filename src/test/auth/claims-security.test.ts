import { expect, it, vi } from 'vitest';
import { getAuthClaimsUser } from '@/utils/supabase/claims';
it('rejects failed JWT verification even when data carries a subject', async () => {
  const getClaims = vi.fn().mockResolvedValue({ data: { claims: { sub: 'forged' } }, error: { message: 'invalid JWT' } });
  expect((await getAuthClaimsUser({ auth: { getClaims } })).user).toBeNull();
});
it('rejects absent sessions and subjects', async () => {
  for (const data of [null, { claims: {} }]) {
    const getClaims = vi.fn().mockResolvedValue({ data, error: null });
    expect((await getAuthClaimsUser({ auth: { getClaims } })).user).toBeNull();
  }
});

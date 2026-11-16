import { expect, it, vi } from 'vitest';
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/utils/supabase/server', () => ({ getServiceClient: () => ({ rpc }) }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));
import { consumeOtpAttempt } from '@/features/auth/actions/_otp-shared';
it('fails closed instead of allowing non-atomic OTP guesses', async () => {
  rpc.mockResolvedValue({ error: { message: 'synthetic failure' } });
  await expect(consumeOtpAttempt('synthetic', 'password_reset')).rejects.toThrow('OTP verification temporarily unavailable');
});
it('enforces the atomic attempt threshold', async () => {
  rpc.mockResolvedValue({ data: 6, error: null });
  expect(await consumeOtpAttempt('synthetic', 'password_reset')).toMatchObject({ lockedOut: true });
});

it('rejects a missing atomic count', async () => {
  rpc.mockResolvedValue({ data: null, error: null });
  await expect(consumeOtpAttempt('synthetic', 'password_reset')).rejects.toThrow();
});

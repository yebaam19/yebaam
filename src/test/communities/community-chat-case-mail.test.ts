import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { processCommunityChatCaseMail } from '@/features/communities/server/community-chat-case-mail.server';
import { checkInternalBearer } from '@/lib/internal-bearer';

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/utils/supabase/server', () => ({ getServiceClient: () => ({ rpc: mocks.rpc }) }));

const id = '11111111-1111-4111-8111-111111111111';
const lease = '22222222-2222-4222-8222-222222222222';
const job = {
  case_id: id, recipient_email: 'recipient@example.test', reason: 'Motivo de prueba completo',
  lease_token: lease, first_attempt_at: new Date().toISOString(),
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('RESEND_API_KEY', 'test-key');
  mocks.rpc.mockImplementation(async (name) => name === 'claim_community_chat_case_mail'
    ? { data: [job], error: null } : { data: true, error: null });
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('community chat case mail outbox', () => {
  it('does not claim recipients when Resend is unconfigured', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    await expect(processCommunityChatCaseMail()).rejects.toThrow('mail_not_configured');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('sends one stable idempotency key and acknowledges only the claimed lease', async () => {
    vi.stubEnv('RESEND_FROM_EMAIL', 'Yebaam <noreply@yebaam.com>');
    const fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    expect(await processCommunityChatCaseMail()).toEqual({ claimed: 1, delivered: 1, pending: 0 });
    expect(fetch).toHaveBeenCalledOnce();
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(options.headers['Idempotency-Key']).toBe(`community-chat-case/${id}`);
    expect(JSON.parse(options.body)).toMatchObject({
      from: 'Yebaam <noreply@yebaam.com>', to: ['recipient@example.test'],
    });
    expect(mocks.rpc).toHaveBeenCalledWith('finish_community_chat_case_mail', {
      target_case: id, claimed_lease: lease, succeeded: true, failure_code: null,
    });
  });

  it('keeps a provider failure pending without recording response or email in the acknowledgement', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('private provider data', { status: 503 })));
    expect(await processCommunityChatCaseMail()).toEqual({ claimed: 1, delivered: 0, pending: 1 });
    expect(mocks.rpc).toHaveBeenLastCalledWith('finish_community_chat_case_mail', {
      target_case: id, claimed_lease: lease, succeeded: false, failure_code: 'retry',
    });
  });

  it('halts an old job before the provider idempotency window expires', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [{ ...job, first_attempt_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }], error: null });
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    expect(await processCommunityChatCaseMail()).toEqual({ claimed: 1, delivered: 0, pending: 1 });
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenLastCalledWith('finish_community_chat_case_mail',
      expect.objectContaining({ succeeded: false, failure_code: 'permanent_failure' }));
  });

  it('requires a configured secret and an exact bearer value', () => {
    const secret = 'a'.repeat(32);
    expect(checkInternalBearer(`Bearer ${secret}`, secret)).toBe('authorized');
    expect(checkInternalBearer(`Bearer ${secret}x`, secret)).toBe('unauthorized');
    expect(checkInternalBearer(null, secret)).toBe('unauthorized');
    expect(checkInternalBearer(`Bearer ${secret}`, 'short')).toBe('unconfigured');
  });
});

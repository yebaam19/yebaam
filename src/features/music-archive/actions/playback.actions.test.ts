import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getServerClient: vi.fn(), getServiceClient: vi.fn(), getUser: vi.fn(),
  getSignedFileUrl: vi.fn(), from: vi.fn(), enabled: true,
  query: { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() },
}));
vi.mock('@/utils/supabase/server', () => ({
  getServerClient: mocks.getServerClient,
  getServiceClient: mocks.getServiceClient,
}));
vi.mock('@/lib/cloudflare/r2', () => ({ getSignedFileUrl: mocks.getSignedFileUrl }));
vi.mock('../config', () => ({ get MUSIC_CLUB_ENABLED() { return mocks.enabled; } }));

import { getTrackPlayUrl } from './playback.actions';

const trackId = '8b7cead5-609e-4e4e-ae2d-1a2181cb7d25';
const viewerId = 'ce16b034-94d2-47c8-88d7-5d315e3a9016';
const signed = {
  url: 'https://r2.example.test/track.mp3?signature=test',
  expiresAt: 1_800_003_600_000,
  serverTime: 1_800_000_000_123,
};
const failure = { ok: false, error: 'No se pudo cargar el audio.' };
const missingSession = { name: 'AuthSessionMissingError', status: 400, message: 'Auth session missing!' };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.enabled = true;
  mocks.getServerClient.mockResolvedValue({ auth: { getUser: mocks.getUser }, from: mocks.from });
  mocks.getUser.mockResolvedValue({ data: { user: { id: viewerId } }, error: null });
  mocks.from.mockReturnValue(mocks.query);
  mocks.query.select.mockReturnValue(mocks.query);
  mocks.query.eq.mockReturnValue(mocks.query);
  mocks.query.maybeSingle.mockResolvedValue({ data: { r2_key: 'stored/track.mp3' }, error: null });
  mocks.getSignedFileUrl.mockResolvedValue(signed);
});

describe('getTrackPlayUrl', () => {
  it('returns expiry and verified scope, signing only the caller-visible stored key', async () => {
    expect(await getTrackPlayUrl(trackId)).toEqual({ ok: true, data: { ...signed, viewerId } });
    expect(mocks.getUser).toHaveBeenCalledOnce();
    expect(mocks.from).toHaveBeenCalledExactlyOnceWith('music_tracks');
    expect(mocks.query.select).toHaveBeenCalledExactlyOnceWith('r2_key');
    expect(mocks.query.eq).toHaveBeenCalledExactlyOnceWith('id', trackId);
    expect(mocks.getSignedFileUrl).toHaveBeenCalledExactlyOnceWith('stored/track.mp3', 3600);
    expect(mocks.getServiceClient).not.toHaveBeenCalled();
  });

  it.each([null, missingSession])('keeps public playback available without a session (%j)', async (error) => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error });
    expect(await getTrackPlayUrl(trackId)).toEqual({ ok: true, data: { ...signed, viewerId: null } });
    expect(mocks.getSignedFileUrl).toHaveBeenCalledOnce();
    expect(mocks.getServiceClient).not.toHaveBeenCalled();
  });

  it.each(['', 'stored/track.mp3', 'https://r2.example.test/file', 'not-a-uuid', null, 123])(
    'rejects invalid track IDs before auth, database, or signing (%j)', async (value) => {
      expect(await getTrackPlayUrl(value as string)).toEqual({ ok: false, error: 'Pista no válida.' });
      expect(mocks.getServerClient).not.toHaveBeenCalled();
      expect(mocks.getSignedFileUrl).not.toHaveBeenCalled();
    },
  );

  it('honors the feature kill switch before doing any work', async () => {
    mocks.enabled = false;
    expect((await getTrackPlayUrl(trackId)).ok).toBe(false);
    expect(mocks.getServerClient).not.toHaveBeenCalled();
    expect(mocks.getSignedFileUrl).not.toHaveBeenCalled();
  });

  it.each([
    { name: 'AuthRetryableFetchError', status: 503, message: 'upstream detail' },
    { name: 'AuthApiError', status: 401, code: 'bad_jwt', message: 'invalid token' },
    { name: 'AuthApiError', status: 400, code: 'session_not_found' },
    { name: 'AuthApiError', status: 400, code: 'refresh_token_not_found' },
    { name: 'AuthUnknownError', status: 400, message: 'Auth session missing!' },
    { name: 'AuthSessionMissingError', status: 503, message: 'Auth session missing!' },
  ])('does not downgrade auth failures to anonymous (%j)', async (error) => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error });
    expect(await getTrackPlayUrl(trackId)).toEqual(failure);
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.getSignedFileUrl).not.toHaveBeenCalled();
  });

  it('does not trust a user returned together with an auth error', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: viewerId } }, error: missingSession });
    expect(await getTrackPlayUrl(trackId)).toEqual(failure);
    expect(mocks.getSignedFileUrl).not.toHaveBeenCalled();
  });

  it.each([null, {}, { r2_key: null }, { r2_key: '' }, { r2_key: ' ' }, { r2_key: 123 }])(
    'does not sign missing, RLS-hidden, or malformed rows (%j)', async (data) => {
      mocks.query.maybeSingle.mockResolvedValue({ data, error: null });
      expect(await getTrackPlayUrl(trackId)).toEqual({ ok: false, error: 'Pista no encontrada.' });
      expect(mocks.getSignedFileUrl).not.toHaveBeenCalled();
    },
  );

  it.each([null, { r2_key: 'stored/track.mp3' }])('fails closed on DB errors even with data', async (data) => {
    mocks.query.maybeSingle.mockResolvedValue({ data, error: { message: 'private database details' } });
    expect(await getTrackPlayUrl(trackId)).toEqual(failure);
    expect(mocks.getSignedFileUrl).not.toHaveBeenCalled();
  });

  it.each(['getServerClient', 'getUser', 'getSignedFileUrl'] as const)(
    'redacts thrown %s errors', async (source) => {
      mocks[source].mockRejectedValue(new Error('private configuration or credential detail'));
      expect(await getTrackPlayUrl(trackId)).toEqual(failure);
    },
  );

  it('redacts thrown database errors without signing', async () => {
    mocks.query.maybeSingle.mockRejectedValue(new Error('private database detail'));
    expect(await getTrackPlayUrl(trackId)).toEqual(failure);
    expect(mocks.getSignedFileUrl).not.toHaveBeenCalled();
  });

  it('reauthorizes every request instead of caching URLs on the server', async () => {
    expect((await getTrackPlayUrl(trackId)).ok).toBe(true);
    mocks.query.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect((await getTrackPlayUrl(trackId)).ok).toBe(false);
    expect(mocks.getUser).toHaveBeenCalledTimes(2);
    expect(mocks.query.maybeSingle).toHaveBeenCalledTimes(2);
    expect(mocks.getSignedFileUrl).toHaveBeenCalledOnce();
  });
});

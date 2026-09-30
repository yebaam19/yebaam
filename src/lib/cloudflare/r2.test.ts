import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getSignedUrl, send } = vi.hoisted(() => ({ getSignedUrl: vi.fn(), send: vi.fn() }));
vi.mock('@aws-sdk/client-s3', () => {
  class Command { constructor(public input: Record<string, unknown>) {} }
  return {
    S3Client: class { send = send; },
    GetObjectCommand: Command, PutObjectCommand: Command,
    DeleteObjectCommand: Command, HeadObjectCommand: Command,
  };
});
vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl }));

import {
  getDownloadUrl, getPresignedUploadUrl, getPublicAudioUrl,
  getPublicFileUrl, getSignedFileUrl,
} from './r2';

const now = Date.parse('2026-09-30T06:00:00.987Z');
const signingTime = Date.parse('2026-09-30T06:00:00.000Z');
const url = 'https://r2.example.test/track.mp3?signature=test';

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(now);
  for (const name of ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET']) {
    vi.stubEnv(name, `test-${name.toLowerCase()}`);
  }
  vi.stubEnv('R2_ENDPOINT', 'https://r2.example.test');
  getSignedUrl.mockResolvedValue(url);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('R2 signing metadata', () => {
  it('derives expiry from the exact second-aligned signing timestamp', async () => {
    expect(await getSignedFileUrl('stored/track.mp3')).toEqual({
      url, expiresAt: signingTime + 3_600_000, serverTime: now,
    });
    expect(getSignedUrl).toHaveBeenCalledExactlyOnceWith(
      expect.anything(),
      expect.objectContaining({ input: { Bucket: 'test-r2_bucket', Key: 'stored/track.mp3' } }),
      { expiresIn: 3600, signingDate: new Date(signingTime) },
    );
    expect(send).not.toHaveBeenCalled();
  });

  it('does not extend expiry by time spent signing', async () => {
    getSignedUrl.mockImplementation(async () => {
      vi.setSystemTime(now + 1750);
      return url;
    });
    expect(await getSignedFileUrl('stored/track.mp3', 60)).toEqual({
      url, expiresAt: signingTime + 60_000, serverTime: now + 1750,
    });
  });

  it('signs afresh on every server request', async () => {
    await getSignedFileUrl('stored/track.mp3');
    vi.setSystemTime(now + 10_000);
    const result = await getSignedFileUrl('stored/track.mp3');
    expect(getSignedUrl).toHaveBeenCalledTimes(2);
    expect(result.expiresAt).toBe(signingTime + 3_610_000);
    expect(send).not.toHaveBeenCalled();
  });
});

describe('existing R2 helper compatibility', () => {
  it('keeps the public audio alias and string-returning default file URL', async () => {
    expect(getPublicAudioUrl).toBe(getPublicFileUrl);
    expect(await getPublicFileUrl('file.pdf')).toBe(url);
    expect(getSignedUrl.mock.calls[0][2]).toMatchObject({ expiresIn: 3600 });
  });

  it.each([900, 7200])('retains custom file/audio TTL %i', async (ttl) => {
    expect(await getPublicAudioUrl('chat/audio.mp3', ttl)).toBe(url);
    expect(getSignedUrl.mock.calls[0][2]).toMatchObject({ expiresIn: ttl });
  });

  it('does not change the admin download TTL or disposition', async () => {
    expect(await getDownloadUrl('file.pdf', 'report.pdf')).toBe(url);
    expect(getSignedUrl.mock.calls[0][2]).toEqual({ expiresIn: 900 });
    expect(getSignedUrl.mock.calls[0][1].input).toMatchObject({
      Key: 'file.pdf', ResponseContentDisposition: expect.stringContaining('attachment;'),
    });
  });

  it('does not change PUT signing or its bound upload length', async () => {
    expect(await getPresignedUploadUrl('new.mp3', 'audio/mpeg', 300, 100)).toEqual({ url, key: 'new.mp3' });
    expect(getSignedUrl.mock.calls[0][2]).toEqual({ expiresIn: 300 });
    expect(getSignedUrl.mock.calls[0][1].input).toMatchObject({
      Key: 'new.mp3', ContentType: 'audio/mpeg', ContentLength: 100,
    });
  });
});

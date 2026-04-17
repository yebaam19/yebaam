import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

const API_BASE = 'https://api.cloudflare.com/client/v4';

type CfEnvelope<T> = {
  success: boolean;
  errors?: Array<{ code: number; message: string }>;
  messages?: Array<{ code: number; message: string }>;
  result: T;
};

type DirectUploadResult = {
  uid: string;
  uploadURL: string;
};

type StreamVideo = {
  uid: string;
  status: { state: 'pendingupload' | 'queued' | 'inprogress' | 'ready' | 'error'; errorReasonCode?: string };
  duration: number;
  input?: { width: number; height: number };
  thumbnail: string;
  playback?: { hls: string; dash: string };
  meta: Record<string, string>;
  readyToStream: boolean;
};

function creds() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    throw new Error(
      'Cloudflare Stream is not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.',
    );
  }
  return { accountId, apiToken };
}

async function unwrap<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as CfEnvelope<T> | null;
  if (!res.ok || !body?.success) {
    const msg = body?.errors?.[0]?.message ?? `Cloudflare ${res.status}`;
    throw new Error(msg);
  }
  return body.result;
}

export async function createStreamDirectUploadUrl(options: {
  maxDurationSeconds: number;
  meta?: Record<string, string>;
}): Promise<DirectUploadResult> {
  const { accountId, apiToken } = creds();
  const res = await fetch(`${API_BASE}/accounts/${accountId}/stream/direct_upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      maxDurationSeconds: options.maxDurationSeconds,
      meta: options.meta,
    }),
  });
  return unwrap<DirectUploadResult>(res);
}

/** Backfill helper: Stream pulls the video from a public URL and transcodes async. */
export async function copyStreamFromUrl(options: {
  url: string;
  meta?: Record<string, string>;
}): Promise<StreamVideo> {
  const { accountId, apiToken } = creds();
  const res = await fetch(`${API_BASE}/accounts/${accountId}/stream/copy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });
  return unwrap<StreamVideo>(res);
}

export async function getStreamVideo(uid: string): Promise<StreamVideo> {
  const { accountId, apiToken } = creds();
  const res = await fetch(`${API_BASE}/accounts/${accountId}/stream/${uid}`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  return unwrap<StreamVideo>(res);
}

export async function deleteStreamVideo(uid: string): Promise<void> {
  const { accountId, apiToken } = creds();
  const res = await fetch(`${API_BASE}/accounts/${accountId}/stream/${uid}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  await unwrap<unknown>(res);
}

/**
 * Verify a Cloudflare Stream webhook.
 * CF sends `Webhook-Signature: time=<unix>,sig1=<hex>` and the signed payload is `<time>.<raw_body>`.
 */
export function verifyStreamWebhook(signatureHeader: string, rawBody: string): boolean {
  const secret = process.env.CLOUDFLARE_STREAM_WEBHOOK_SECRET;
  if (!secret) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => p.split('=').map((s) => s.trim()) as [string, string]),
  );
  const time = parts.time;
  const sig1 = parts.sig1;
  if (!time || !sig1) return false;

  const expected = createHmac('sha256', secret).update(`${time}.${rawBody}`).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(sig1, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

import 'server-only';

const API_BASE = 'https://api.cloudflare.com/client/v4';

type CfEnvelope<T> = {
  success: boolean;
  errors?: Array<{ code: number; message: string }>;
  messages?: Array<{ code: number; message: string }>;
  result: T;
};

type DirectUploadResult = {
  id: string;
  uploadURL: string;
};

type ImageResult = {
  id: string;
  filename: string;
  meta: Record<string, string>;
  requireSignedURLs: boolean;
  variants: string[];
  uploaded: string;
};

function creds() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    throw new Error(
      'Cloudflare Images is not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.',
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

/** One-time URL the browser POSTs the file to (Direct Creator Upload). */
export async function createImageDirectUploadUrl(options?: {
  metadata?: Record<string, string>;
  expiryMinutes?: number;
}): Promise<DirectUploadResult> {
  const { accountId, apiToken } = creds();
  const form = new FormData();
  if (options?.metadata) form.append('metadata', JSON.stringify(options.metadata));
  if (options?.expiryMinutes) {
    const expiry = new Date(Date.now() + options.expiryMinutes * 60_000).toISOString();
    form.append('expiry', expiry);
  }

  const res = await fetch(`${API_BASE}/accounts/${accountId}/images/v2/direct_upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiToken}` },
    body: form,
  });
  return unwrap<DirectUploadResult>(res);
}

/** Backfill helper: tell Cloudflare to fetch an image from a public URL. */
export async function uploadImageFromUrl(
  url: string,
  metadata?: Record<string, string>,
): Promise<ImageResult> {
  const { accountId, apiToken } = creds();
  const form = new FormData();
  form.append('url', url);
  if (metadata) form.append('metadata', JSON.stringify(metadata));

  const res = await fetch(`${API_BASE}/accounts/${accountId}/images/v1`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiToken}` },
    body: form,
  });
  return unwrap<ImageResult>(res);
}

export async function deleteImage(id: string): Promise<void> {
  const { accountId, apiToken } = creds();
  const res = await fetch(`${API_BASE}/accounts/${accountId}/images/v1/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  await unwrap<unknown>(res);
}

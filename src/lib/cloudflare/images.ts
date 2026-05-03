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
  /** When true, the uploaded image cannot be fetched without a signed URL. Use for KYC photos / ID documents. */
  requireSignedURLs?: boolean;
}): Promise<DirectUploadResult> {
  const { accountId, apiToken } = creds();
  const form = new FormData();
  if (options?.metadata) form.append('metadata', JSON.stringify(options.metadata));
  if (options?.expiryMinutes) {
    const expiry = new Date(Date.now() + options.expiryMinutes * 60_000).toISOString();
    form.append('expiry', expiry);
  }
  if (options?.requireSignedURLs) form.append('requireSignedURLs', 'true');

  const res = await fetch(`${API_BASE}/accounts/${accountId}/images/v2/direct_upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiToken}` },
    body: form,
  });
  return unwrap<DirectUploadResult>(res);
}

/** Set / clear the requireSignedURLs flag on an existing image. Used by the
 *  backfill script and any one-off remediation. */
export async function setImageRequireSignedUrls(
  imageId: string,
  requireSignedURLs: boolean,
): Promise<ImageResult> {
  const { accountId, apiToken } = creds();
  const res = await fetch(`${API_BASE}/accounts/${accountId}/images/v1/${imageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requireSignedURLs }),
  });
  return unwrap<ImageResult>(res);
}

/** Cloudflare Images signing keys (account-scoped, used for HMAC URL signing). */
type ImagesSigningKey = { name: string; value: string };
type SigningKeysResponse = { keys: ImagesSigningKey[] };

let cachedSigningKey: string | null = null;

/** Fetch (and lazily create) the Cloudflare Images signing key for this account.
 *  Cloudflare Images supports up to 4 keys; we use the first one we find, or
 *  create one named "yebaam-default" if none exist. */
async function getSigningKey(): Promise<string> {
  if (cachedSigningKey) return cachedSigningKey;
  const { accountId, apiToken } = creds();

  const listRes = await fetch(`${API_BASE}/accounts/${accountId}/images/v1/keys`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  const list = await unwrap<SigningKeysResponse>(listRes);

  if (list.keys && list.keys.length > 0) {
    cachedSigningKey = list.keys[0].value;
    return cachedSigningKey;
  }

  // No key yet — create one.
  const createRes = await fetch(
    `${API_BASE}/accounts/${accountId}/images/v1/keys/yebaam-default`,
    { method: 'PUT', headers: { Authorization: `Bearer ${apiToken}` } },
  );
  const created = await unwrap<SigningKeysResponse>(createRes);
  if (!created.keys || created.keys.length === 0) {
    throw new Error('Cloudflare did not return a signing key after creation');
  }
  cachedSigningKey = created.keys[0].value;
  return cachedSigningKey;
}

/** Mint a signed Cloudflare Images delivery URL.
 *
 *  Signing model: HMAC-SHA256 over the URL path (after the account hash, including
 *  the leading `/` and any query string), keyed by the account's signing key,
 *  hex-encoded as the `sig` query parameter. An `exp` (unix seconds) param bounds
 *  the validity window. Spec: https://developers.cloudflare.com/images/manage-images/serve-private-images/ */
export async function signImageDeliveryUrl(
  imageId: string,
  options?: { variant?: string; expirySeconds?: number },
): Promise<string> {
  const hash = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;
  if (!hash) throw new Error('NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH is not set');
  const variant = options?.variant ?? 'public';
  const expiry = Math.floor(Date.now() / 1000) + (options?.expirySeconds ?? 60 * 10);

  const key = await getSigningKey();
  const path = `/${hash}/${imageId}/${variant}`;
  const stringToSign = `${path}?exp=${expiry}`;

  const { createHmac } = await import('node:crypto');
  const sig = createHmac('sha256', key).update(stringToSign).digest('hex');
  return `https://imagedelivery.net${path}?exp=${expiry}&sig=${sig}`;
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

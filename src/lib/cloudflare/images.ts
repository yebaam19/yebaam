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

/**
 * Cloudflare hands out UUID ids for Direct Creator Uploads (36 chars); the
 * wider `[A-Za-z0-9_-]` charset leaves room for that without admitting the
 * three characters that matter: `/`, `.` and `%`.
 */
const CF_IMAGE_ID = /^[A-Za-z0-9_-]{20,64}$/;

export const isCloudflareImageId = (value: unknown): value is string =>
  typeof value === 'string' && CF_IMAGE_ID.test(value);

/**
 * Provenance stamped into Cloudflare's own image metadata at mint time, by the
 * server, from the verified session. Some media — ephemeral anonymous-chat
 * images above all — never gets a database row, so Cloudflare's metadata is the
 * only place an ownership check can read from.
 */
export const CF_META_UPLOADED_BY = 'uploadedBy';
export const CF_META_SOURCE = 'source';

/** Marks an image as belonging to the ephemeral anonymous-chat surface. */
export const CF_SOURCE_ANON_CHAT = 'anon-chat';

export type CloudflareImageProvenance = {
  uploadedBy: string | null;
  source: string | null;
};

/**
 * Read an image's server-stamped provenance back from Cloudflare. Returns null
 * when the image does not exist (a deleted or invented id), which callers
 * should treat exactly like "not yours".
 */
export async function getImageProvenance(id: string): Promise<CloudflareImageProvenance | null> {
  const { accountId, apiToken } = creds();
  const safeId = assertImageId(id);
  const res = await fetch(`${API_BASE}/accounts/${accountId}/images/v1/${safeId}`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  if (!res.ok) return null;
  const image = await unwrap<ImageResult>(res).catch(() => null);
  if (!image) return null;
  return {
    uploadedBy: image.meta?.[CF_META_UPLOADED_BY] ?? null,
    source: image.meta?.[CF_META_SOURCE] ?? null,
  };
}

/**
 * Why an id is never interpolated raw: these functions splice it into an
 * account-scoped API path called with the account-wide `CLOUDFLARE_API_TOKEN`,
 * and `fetch()` resolves dot-segments during WHATWG URL parsing. An id of
 * `../../stream/<uid>` collapses `/accounts/<id>/images/v1/../../stream/<uid>`
 * to `/accounts/<id>/stream/<uid>` — the Stream delete endpoint — so an
 * unvalidated id turns any Images call into a general-purpose request against
 * whatever the token is scoped for. Validating *and* encoding is deliberate
 * belt-and-braces: the regex is the contract, the encode is the backstop.
 */
function assertImageId(id: string): string {
  if (!CF_IMAGE_ID.test(id)) throw new Error('Invalid Cloudflare image id');
  return encodeURIComponent(id);
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
  // An unvalidated id could carry `/` and `?` into the path we HMAC — enough to
  // append an attacker-chosen `exp` ahead of ours and make the effective expiry
  // theirs rather than the server's.
  const path = `/${hash}/${assertImageId(imageId)}/${variant}`;
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
  const safeId = assertImageId(id);
  const res = await fetch(`${API_BASE}/accounts/${accountId}/images/v1/${safeId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  await unwrap<unknown>(res);
}

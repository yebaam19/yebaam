/** Shared by the Next.js signer and the Worker; contains no credentials. */
export const MUSIC_CACHE_MAX_TTL = 3600;

async function key(secret: string) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

function payload(method: string, path: string, expires: number) {
  return new TextEncoder().encode(`${method}\n${path}\n${expires}`);
}

export async function signMusicCache(secret: string, method: string, path: string, expires: number) {
  const bytes = await crypto.subtle.sign('HMAC', await key(secret), payload(method, path, expires));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyMusicCache(secret: string, method: string, url: URL) {
  const expires = Number(url.searchParams.get('expires'));
  const now = Math.floor(Date.now() / 1000);
  const signature = url.searchParams.get('signature') ?? '';
  if (secret.length < 32 || !Number.isSafeInteger(expires) || expires <= now ||
      expires > now + MUSIC_CACHE_MAX_TTL || !/^[a-f0-9]{64}$/.test(signature)) return false;
  const bytes = Uint8Array.from(signature.match(/.{2}/g)!, (b) => parseInt(b, 16));
  return crypto.subtle.verify('HMAC', await key(secret), bytes, payload(method, url.pathname, expires));
}

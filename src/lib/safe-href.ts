/**
 * Safe outbound-link helpers.
 *
 * User-supplied website / social URLs are stored verbatim in the DB, so any
 * `<a href={row.website}>` is a stored-XSS sink if the value is a `javascript:`
 * (or `data:`, `vbscript:` …) URI. Every render site that emits an anchor from a
 * DB-backed URL must go through `safeExternalHref()`, and every write path must
 * gate on `isSafeExternalUrl()` / `isValidWebsite()`.
 */

const SAFE_PROTOCOLS = new Set(['http:', 'https:']);

/** Looks like a bare host such as `example.com` or `sub.example.co/path`. */
const BARE_HOST_RE = /^[\w.-]+\.[a-z]{2,}(\/|$)/i;

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return SAFE_PROTOCOLS.has(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

/**
 * Strict check: non-empty string that parses as an absolute `http:`/`https:` URL.
 * Bare hosts (no scheme) are NOT accepted here — use this on write paths.
 */
export function isSafeExternalUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return parseHttpUrl(trimmed) !== null;
}

/**
 * Optional-website validator: empty/null/undefined is fine, anything else must
 * satisfy `isSafeExternalUrl`. Shared by clubs / communities / blogs writers.
 */
export function isValidWebsite(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  return isSafeExternalUrl(value);
}

/**
 * Returns an href that is safe to put in `<a href>` (http/https only), or `null`
 * when the value is missing, malformed, or uses a dangerous scheme. A bare host
 * (`example.com`) is promoted to `https://example.com`. Callers must skip the
 * anchor (render plain text or nothing) when this returns `null`.
 */
export function safeExternalHref(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const direct = parseHttpUrl(trimmed);
  if (direct) return direct.href;

  // No scheme (or an unparseable one): only promote values that look like a bare host.
  if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && BARE_HOST_RE.test(trimmed)) {
    const promoted = parseHttpUrl(`https://${trimmed}`);
    if (promoted) return promoted.href;
  }

  return null;
}

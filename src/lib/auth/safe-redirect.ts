const DEFAULT_FALLBACK = '/feed';

/**
 * Restrict post-auth redirects to same-origin relative paths.
 * Blocks open redirects (`//evil.com`, `/\\evil.com`, encoded tricks).
 */
export function sanitizeRedirectPath(
  value: string | null | undefined,
  fallback: string = DEFAULT_FALLBACK,
): string {
  if (!value) return fallback;

  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;
  if (/[\x00-\x1f\\]/.test(trimmed)) return fallback;

  try {
    const parsed = new URL(trimmed, 'http://localhost');
    if (parsed.protocol !== 'http:' || parsed.hostname !== 'localhost') return fallback;
    if (!parsed.pathname.startsWith('/')) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

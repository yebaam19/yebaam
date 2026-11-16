const DEFAULT_FALLBACK = '/feed';

// Auth/API/static endpoints are never post-login destinations.
const DESTINATIONS = new Set([
  'feed', 'familias', 'friends', 'profiles', 'clubs', 'blogs', 'professional-profile',
  'chat', 'chat-publico', 'comunidades', 'foro', 'cities', 'insignias',
  'professional-services', 'negocios', 'artistas', 'escuelas', 'programas',
  'oportunidades', 'promociones', 'normativa', 'umbral', 'musica', 'admin',
  'ajustes', 'noticias', 'search', 'stories', 'watch', 'paginas', 'notifications', 'grupos',
]);

const RESERVED = new Set(['login', 'signup', 'verify-email', 'forgot-password', 'reset-password', 'auth', 'api', '_next', 'monitoring']);

/**
 * Restrict post-auth redirects to approved app route families.
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
    if (/%2f/i.test(parsed.pathname)) return fallback;
    const pathname = decodeURIComponent(parsed.pathname);
    if (/[\x00-\x1f\x7f\\%]/.test(pathname)) return fallback;
    if (pathname.split('/').some((part) => part === '.' || part === '..')) return fallback;
    const segments = pathname.split('/').filter(Boolean);
    const root = segments[0];
    // The product's /[username] route admits a single profile segment.
    // Keep punctuation used by email-derived usernames, excluding file endpoints.
    const profile = segments.length === 1 && /^[\p{L}\p{N}_][\p{L}\p{N}_.-]*$/u.test(root)
      && !/\.(?:php|html?|json|xml|txt|js|css|png|ico)$/i.test(root);
    if (RESERVED.has(root) || (!DESTINATIONS.has(root) && !profile)) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

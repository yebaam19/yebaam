const DEFAULT_FALLBACK = '/feed';

// Auth/API/static endpoints are never post-login destinations. Profile links
// with arbitrary usernames can still be opened normally after signing in.
const DESTINATIONS = new Set([
  'feed', 'familias', 'friends', 'profiles', 'clubs', 'blogs', 'professional-profile',
  'chat', 'chat-publico', 'comunidades', 'foro', 'cities', 'insignias',
  'professional-services', 'negocios', 'artistas', 'escuelas', 'programas',
  'oportunidades', 'promociones', 'normativa', 'umbral', 'musica', 'admin',
  'ajustes', 'noticias', 'search', 'stories', 'watch', 'paginas', 'notifications', 'grupos',
]);

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
    const pathname = decodeURIComponent(parsed.pathname);
    if (/[\x00-\x1f\x7f\\%]/.test(pathname)) return fallback;
    if (pathname.split('/').some((part) => part === '.' || part === '..')) return fallback;
    if (!DESTINATIONS.has(pathname.split('/')[1])) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

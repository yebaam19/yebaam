/**
 * Helpers for building PostgREST filter strings safely.
 *
 * `.or('a.ilike.%x%,b.ilike.%x%')` is a *grammar*, not a parameterized query:
 * `,` separates conditions and `(`/`)` group them, so interpolating raw user
 * input lets a caller append extra conditions (`,id.neq.…`) or crash the
 * query. PostgREST also rewrites `*` to `%` for like/ilike. These helpers strip
 * the grammar chars and escape the ilike wildcards so the term can only ever be
 * a literal substring. (`.` is safe: it only separates column/operator at the
 * head of a condition, which we always write ourselves.)
 */

/**
 * Sanitize a free-text search term for interpolation inside `.or()` /
 * `.ilike()` filters. Removes PostgREST grammar chars (`,` `(` `)` `*`), then
 * escapes `\`, `%` and `_` so they match literally under ilike.
 */
export function sanitizePostgrestFilterTerm(input: string): string {
  return input
    .replace(/[,()*]/g, ' ')
    .replace(/[\\%_]/g, '\\$&')
    .replace(/\s+/g, ' ')
    .trim();
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when `value` is a canonical RFC 4122 UUID string. */
export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

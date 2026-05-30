/**
 * Per-viewer auto-name for unnamed group conversations.
 *
 * Pass the first names of the *other* members (exclude the current viewer) so
 * the result reads like Facebook's "Ana, Luis" — never includes "you", and is
 * computed at read time so it never goes stale when membership changes.
 *
 * Used by both `GET /api/conversations` and `ChatPageClient` so the sidebar,
 * the dropdown, and the full-page header all agree on the same string.
 */
export function groupAutoName(otherFirstNames: string[]): string {
  const names = otherFirstNames.map((n) => (n ?? '').trim()).filter(Boolean);
  if (names.length === 0) return 'Grupo';
  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} y ${names.length - 2} más`;
}

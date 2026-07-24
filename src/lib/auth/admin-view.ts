/**
 * Admin "ver como público" escape hatch.
 *
 * The proxy corrals platform-admin sessions inside `/admin/**` — any other route
 * bounces back to the admin panel. That makes moderation impossible (an admin
 * could never open the profile of the user they are reviewing), so admin-panel
 * links that intentionally point at a public page carry `?adminView=1` and the
 * proxy lets that single request through.
 *
 * It is a UX corral, not a security boundary: the param only lifts a redirect
 * that exists to keep admin sessions on the admin surface. Every page behind it
 * keeps its own auth/RLS checks.
 */
export const ADMIN_VIEW_PARAM = 'adminView'

export function hasAdminViewParam(searchParams: URLSearchParams): boolean {
  return searchParams.get(ADMIN_VIEW_PARAM) === '1'
}

/** Public URL + the escape-hatch param, ready for a `<Link href>`. */
export function withAdminView(path: string): string {
  return `${path}${path.includes('?') ? '&' : '?'}${ADMIN_VIEW_PARAM}=1`
}

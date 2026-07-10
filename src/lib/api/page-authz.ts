import type { getServerClient } from '@/utils/supabase/server';

type ServerClient = Awaited<ReturnType<typeof getServerClient>>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PageRef {
  id: string;
  ownerId: string;
}

/**
 * Resolve a `pages` row from either a uuid or a slug. The lookup runs through
 * the caller's session-bound client, so RLS decides visibility: a page the
 * viewer may not see resolves to `null` (→ 404), never a leak.
 */
export async function resolvePage(
  client: ServerClient,
  idOrSlug: string
): Promise<PageRef | null> {
  const column = UUID_RE.test(idOrSlug) ? 'id' : 'slug';
  const { data } = await client
    .from('pages')
    .select('id,owner_id')
    .eq(column, idOrSlug)
    .maybeSingle();

  const row = data as { id: string; owner_id: string } | null;
  return row ? { id: row.id, ownerId: row.owner_id } : null;
}

export type PageAuthz =
  | { ok: true; page: PageRef; userId: string }
  | { ok: false; status: 401 | 403 | 404; error: string };

/**
 * Gate for acts that ATTRIBUTE AUTHORITY over a page — appointing or removing
 * team members. Only the page owner (`pages.owner_id`) qualifies.
 *
 * Deliberately stricter than the `check_page_admin` RPC used by the posting
 * path: that RPC also returns true for team ADMIN/EDITOR, and letting an EDITOR
 * mint another ADMIN is a privilege-escalation ladder. It is also deliberately
 * enforced HERE, in the application layer, rather than trusting the
 * `page_team_members` RLS policy alone — per CLAUDE.md, an auth guard that
 * lives in exactly one layer becomes a security bug the moment that layer
 * drifts. Fails closed on every unknown.
 */
export async function requirePageOwner(
  client: ServerClient,
  idOrSlug: string
): Promise<PageAuthz> {
  const { data: auth } = await client.auth.getUser();
  const userId = auth?.user?.id ?? null;
  if (!userId) return { ok: false, status: 401, error: 'Unauthorized' };

  const page = await resolvePage(client, idOrSlug);
  if (!page) return { ok: false, status: 404, error: 'Page not found' };

  if (page.ownerId !== userId) {
    return { ok: false, status: 403, error: 'Forbidden' };
  }

  return { ok: true, page, userId };
}

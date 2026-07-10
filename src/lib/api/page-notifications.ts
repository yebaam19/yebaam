import 'server-only'
import { getServiceClient } from '@/utils/supabase/server'

// Lowercase snake_case to satisfy the notifications_type_check CHECK
// (migration 20260710140000) — uppercase inserts fail the constraint silently.
type PageNotifType =
  | 'page_follow'
  | 'page_recommend'
  | 'page_like'
  | 'page_message'
  | 'page_audition'
  | 'page_event'

/**
 * Insert a page-scoped notification for the page owner (PDF §10).
 * Fire-and-forget safe: callers should wrap with `after()` from next/server
 * when invoked from a Route Handler that must not block the response.
 *
 * Pass `slug` when the caller already resolved it; otherwise it is fetched
 * alongside owner_id (same single query) so the `link` column always points
 * at the page detail route.
 */
export async function notifyPageOwner(input: {
  pageId: string
  type: PageNotifType
  actorId: string
  message: string
  slug?: string
}): Promise<void> {
  const client = getServiceClient()
  const { data: page } = await client
    .from('pages')
    .select('owner_id, slug')
    .eq('id', input.pageId)
    .maybeSingle()

  const row = page as { owner_id?: string; slug?: string } | null
  const ownerId = row?.owner_id
  if (!ownerId || ownerId === input.actorId) return

  const slug = input.slug ?? row?.slug
  const { error } = await client.from('notifications').insert({
    type: input.type,
    recipient_id: ownerId,
    actor_id: input.actorId,
    related_type: 'page',
    related_id: input.pageId,
    message: input.message,
    link: slug ? `/paginas/${slug}` : null,
  })
  if (error) console.error('[notifyPageOwner]', error.message)
}

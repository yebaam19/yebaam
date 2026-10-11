import 'server-only'
import { getServerClient } from '@/utils/supabase/server'
import type { ForoSpace, ForoForum } from '@/features/foro/types'
import type { ForumRow } from './spaces.server'

/**
 * Returns the public-facing URL of the resource that owns this forum space, so
 * forum pages can render a "Back to <owner>" breadcrumb. Currently wired for
 * communities; add other resource types here as their forum integrations land.
 */
export async function getSpaceOwnerBackLink(
  space: ForoSpace,
): Promise<{ href: string; label: string } | null> {
  if (space.ownerType === 'community') {
    const client = await getServerClient()
    const { data } = await client
      .from('communities')
      .select('slug, name')
      .eq('id', space.ownerId)
      .maybeSingle()
    const row = data as { slug: string; name: string } | null
    if (!row) return null
    return { href: `/comunidades/${row.slug}`, label: row.name }
  }
  return null
}

export async function getForumByslugInSpace(
  spaceId: string,
  forumSlug: string,
): Promise<ForoForum | null> {
  const client = await getServerClient()
  // Forums don't have space_id directly — we join through forum_categories.
  const { data: cats } = await client
    .from('forum_categories')
    .select('id')
    .eq('space_id', spaceId)
  const catIds = ((cats ?? []) as { id: string }[]).map((c) => c.id)
  if (catIds.length === 0) return null
  const { data } = await client
    .from('forums')
    .select('id, category_id, parent_forum_id, name, description, slug, position')
    .in('category_id', catIds)
    .eq('slug', forumSlug)
    .maybeSingle()
  if (!data) return null
  const row = data as ForumRow
  return {
    id: row.id,
    categoryId: row.category_id,
    spaceId,
    parentForumId: row.parent_forum_id,
    name: row.name,
    description: row.description,
    slug: row.slug,
    position: row.position,
    topicCount: 0,
    postCount: 0,
    lastPostAt: null,
    lastPostAuthor: null,
    lastTopicTitle: null,
    lastTopicSlug: null,
    subforums: [],
  }
}

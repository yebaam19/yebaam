import 'server-only'
import { getServerClient } from '@/utils/supabase/server'
import { loadProfiles, toAuthor } from './_profile-row'
import type {
  ForoCategory,
  ForoForum,
  ForoSpace,
  OwnerType,
  SpaceVisibility,
} from '@/features/foro/types'

/**
 * Forum spaces: the top-level container (one per owning resource — community,
 * club, page, …) plus its category → forum board tree.
 */

type CategoryRow = {
  id: string
  name: string
  slug: string
  position: number
  space_id: string
}
type ForumRow = {
  id: string
  category_id: string
  parent_forum_id: string | null
  name: string
  description: string | null
  slug: string
  position: number
}
type SpaceRow = {
  id: string
  owner_type: OwnerType
  owner_id: string
  slug: string
  name: string
  description: string | null
  visibility: SpaceVisibility
  enabled: boolean
  enabled_at: string
  created_at: string
}

function toSpace(row: SpaceRow): ForoSpace {
  return {
    id: row.id,
    ownerType: row.owner_type,
    ownerId: row.owner_id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    visibility: row.visibility,
    enabled: row.enabled,
    enabledAt: row.enabled_at,
    createdAt: row.created_at,
  }
}

export async function listPublicSpaces(): Promise<ForoSpace[]> {
  const client = await getServerClient()
  const { data } = await client
    .from('forum_spaces')
    .select('*')
    .eq('enabled', true)
    .order('created_at', { ascending: false })
  return ((data ?? []) as SpaceRow[]).map(toSpace)
}

export async function getSpaceBySlug(slug: string): Promise<ForoSpace | null> {
  const client = await getServerClient()
  const { data } = await client
    .from('forum_spaces')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (!data) return null
  return toSpace(data as SpaceRow)
}

export async function getSpaceByOwner(
  ownerType: OwnerType,
  ownerId: string,
): Promise<ForoSpace | null> {
  const client = await getServerClient()
  const { data } = await client
    .from('forum_spaces')
    .select('*')
    .eq('owner_type', ownerType)
    .eq('owner_id', ownerId)
    .maybeSingle()
  if (!data) return null
  return toSpace(data as SpaceRow)
}

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
    return { href: `/feed/comunidades/${row.slug}`, label: row.name }
  }
  return null
}

export async function getSpaceBoard(spaceSlug: string): Promise<{
  space: ForoSpace
  categories: ForoCategory[]
} | null> {
  const space = await getSpaceBySlug(spaceSlug)
  if (!space) return null
  return loadSpaceBoard(space)
}

export async function getSpaceBoardByOwner(
  ownerType: OwnerType,
  ownerId: string,
): Promise<{ space: ForoSpace; categories: ForoCategory[] } | null> {
  const space = await getSpaceByOwner(ownerType, ownerId)
  if (!space) return null
  return loadSpaceBoard(space)
}

async function loadSpaceBoard(space: ForoSpace): Promise<{
  space: ForoSpace
  categories: ForoCategory[]
}> {
  const client = await getServerClient()

  const { data: categories } = await client
    .from('forum_categories')
    .select('id, name, slug, position, space_id')
    .eq('space_id', space.id)
    .order('position', { ascending: true })

  const cats = (categories ?? []) as CategoryRow[]
  if (cats.length === 0) {
    return { space, categories: [] }
  }

  const { data: forums } = await client
    .from('forums')
    .select('id, category_id, parent_forum_id, name, description, slug, position')
    .in(
      'category_id',
      cats.map((c) => c.id),
    )
    .order('position', { ascending: true })

  const forumRows = (forums ?? []) as ForumRow[]
  const forumIds = forumRows.map((f) => f.id)

  // Aggregate topic/post counts + newest topic per forum
  const topicCountByForum = new Map<string, number>()
  const postSumByForum = new Map<string, number>()
  const newestByForum = new Map<
    string,
    { title: string; slug: string; lastPostAt: string | null; lastPostAuthorId: string | null }
  >()

  if (forumIds.length > 0) {
    const { data: topics } = await client
      .from('forum_topics')
      .select('forum_id, title, slug, post_count, last_post_at, last_post_author_id')
      .in('forum_id', forumIds)
      .order('last_post_at', { ascending: false, nullsFirst: false })

    for (const t of (topics ?? []) as Array<{
      forum_id: string
      title: string
      slug: string
      post_count: number
      last_post_at: string | null
      last_post_author_id: string | null
    }>) {
      topicCountByForum.set(t.forum_id, (topicCountByForum.get(t.forum_id) ?? 0) + 1)
      postSumByForum.set(t.forum_id, (postSumByForum.get(t.forum_id) ?? 0) + (t.post_count ?? 0))
      if (!newestByForum.has(t.forum_id)) {
        newestByForum.set(t.forum_id, {
          title: t.title,
          slug: t.slug,
          lastPostAt: t.last_post_at,
          lastPostAuthorId: t.last_post_author_id,
        })
      }
    }
  }

  const lastAuthorIds = Array.from(newestByForum.values())
    .map((v) => v.lastPostAuthorId)
    .filter((id): id is string => !!id)
  const profiles = await loadProfiles(lastAuthorIds)

  const forumById = new Map<string, ForoForum>()
  for (const f of forumRows) {
    const newest = newestByForum.get(f.id)
    forumById.set(f.id, {
      id: f.id,
      categoryId: f.category_id,
      spaceId: space.id,
      parentForumId: f.parent_forum_id,
      name: f.name,
      description: f.description,
      slug: f.slug,
      position: f.position,
      topicCount: topicCountByForum.get(f.id) ?? 0,
      postCount: postSumByForum.get(f.id) ?? 0,
      lastPostAt: newest?.lastPostAt ?? null,
      lastPostAuthor: newest?.lastPostAuthorId
        ? toAuthor(profiles.get(newest.lastPostAuthorId))
        : null,
      lastTopicTitle: newest?.title ?? null,
      lastTopicSlug: newest?.slug ?? null,
      subforums: [],
    })
  }

  // Build subforum tree: attach children to parents
  const topLevelByCategory = new Map<string, ForoForum[]>()
  for (const f of forumRows) {
    const node = forumById.get(f.id)!
    if (f.parent_forum_id && forumById.has(f.parent_forum_id)) {
      forumById.get(f.parent_forum_id)!.subforums.push(node)
    } else {
      const list = topLevelByCategory.get(f.category_id) ?? []
      list.push(node)
      topLevelByCategory.set(f.category_id, list)
    }
  }

  const categoriesOut: ForoCategory[] = cats.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    position: c.position,
    spaceId: c.space_id,
    forums: (topLevelByCategory.get(c.id) ?? []).sort((a, b) => a.position - b.position),
  }))

  return { space, categories: categoriesOut }
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

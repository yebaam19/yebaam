import 'server-only';
import { getServiceClient } from '@/utils/supabase/server';

export type BlogRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  profile_image_url: string | null;
  cover_image_url: string | null;
  website: string | null;
  social: Record<string, unknown> | null;
  tags: string[] | null;
  stats: Record<string, unknown> | null;
  is_verified: boolean | null;
  created_at: string;
  updated_at: string;
};

export type OwnerProfile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `blog-${Date.now()}`;
}

/**
 * Provision (or top up) a `forum_spaces` row for a blog so the blog gets a
 * working forum out of the box — space + "General" category + default
 * "Discusión general" forum + owner admin role. Idempotent: safe to call
 * multiple times. Mirrors `ensureClubForumSpace` and uses the service-role
 * client because `forum_spaces` INSERT is gated to platform admins by RLS.
 */
export async function ensureBlogForumSpace(blog: {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
}): Promise<{ spaceId: string; spaceSlug: string } | null> {
  const svc = getServiceClient();

  const { data: existing } = await svc
    .from('forum_spaces')
    .select('id, slug, enabled')
    .eq('owner_type', 'blog')
    .eq('owner_id', blog.id)
    .maybeSingle();

  let spaceId: string;
  let spaceSlug: string;

  if (existing) {
    spaceId = (existing as { id: string }).id;
    spaceSlug = (existing as { slug: string }).slug;
    if (!(existing as { enabled: boolean }).enabled) {
      await svc.from('forum_spaces').update({ enabled: true }).eq('id', spaceId);
    }
  } else {
    const baseSlug = slugify(`blog-${blog.slug || blog.name}`);
    let candidate = baseSlug;
    for (let i = 2; i < 50; i += 1) {
      const { data: clash } = await svc
        .from('forum_spaces')
        .select('id')
        .eq('slug', candidate)
        .maybeSingle();
      if (!clash) break;
      candidate = `${baseSlug}-${i}`;
    }

    const { data: inserted, error: insertErr } = await svc
      .from('forum_spaces')
      .insert({
        owner_type: 'blog',
        owner_id: blog.id,
        slug: candidate,
        name: blog.name,
        visibility: 'public',
        enabled: true,
        enabled_by: blog.owner_id,
      })
      .select('id, slug')
      .single();
    if (insertErr || !inserted) return null;
    spaceId = (inserted as { id: string }).id;
    spaceSlug = (inserted as { slug: string }).slug;
  }

  const categorySlug = `${spaceSlug}-general`;
  const forumSlug = `${spaceSlug}-discusion-general`;

  const { data: cat } = await svc
    .from('forum_categories')
    .select('id')
    .eq('space_id', spaceId)
    .maybeSingle();

  let categoryId: string;
  if (cat) {
    categoryId = (cat as { id: string }).id;
  } else {
    const { data: newCat } = await svc
      .from('forum_categories')
      .insert({ space_id: spaceId, name: 'General', slug: categorySlug, position: 0 })
      .select('id')
      .single();
    if (!newCat) return { spaceId, spaceSlug };
    categoryId = (newCat as { id: string }).id;
  }

  const { data: forum } = await svc
    .from('forums')
    .select('id')
    .eq('category_id', categoryId)
    .maybeSingle();
  if (!forum) {
    await svc.from('forums').insert({
      category_id: categoryId,
      name: 'Discusión general',
      slug: forumSlug,
      description: 'Tema libre para los lectores y seguidores del blog.',
      position: 0,
    });
  }

  const { data: role } = await svc
    .from('forum_roles')
    .select('user_id')
    .eq('space_id', spaceId)
    .eq('user_id', blog.owner_id)
    .maybeSingle();
  if (!role) {
    await svc.from('forum_roles').insert({
      space_id: spaceId,
      user_id: blog.owner_id,
      role: 'admin',
      granted_by: blog.owner_id,
    });
  }

  return { spaceId, spaceSlug };
}

/**
 * Provision (or find) a `public_chat_topics` row dedicated to a blog so the
 * blog's "Chat Público" button has a permanent, blog-named channel inside
 * the global public chat. Scoped via (owner_type='blog', owner_id=blog.id)
 * so it stays out of the canonical topic tab list and gets cleaned up when
 * the blog is deleted. Idempotent. Uses the service-role client because
 * `public_chat_topics` is read-only via RLS; INSERT is gated to service_role.
 */
export async function ensureBlogChatTopic(blog: {
  id: string;
  name: string;
  slug: string;
}): Promise<{ topicId: string; topicSlug: string } | null> {
  const svc = getServiceClient();

  const { data: existing } = await svc
    .from('public_chat_topics')
    .select('id, slug')
    .eq('owner_type', 'blog')
    .eq('owner_id', blog.id)
    .maybeSingle();
  if (existing) {
    return {
      topicId: (existing as { id: string }).id,
      topicSlug: (existing as { slug: string }).slug,
    };
  }

  // Reserve a slug that won't collide with canonical topics or other blogs.
  const baseSlug = slugify(`blog-${blog.slug || blog.name}`);
  let candidateSlug = baseSlug;
  for (let i = 2; i < 50; i += 1) {
    const { data: clash } = await svc
      .from('public_chat_topics')
      .select('id')
      .eq('slug', candidateSlug)
      .maybeSingle();
    if (!clash) break;
    candidateSlug = `${baseSlug}-${i}`;
  }

  const { data: maxRow } = await svc
    .from('public_chat_topics')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = ((maxRow as { position: number } | null)?.position ?? -1) + 1;

  const { data: inserted, error } = await svc
    .from('public_chat_topics')
    .insert({
      slug: candidateSlug,
      name: blog.name,
      description: `Conversación abierta para los lectores y seguidores del blog "${blog.name}".`,
      position: nextPosition,
      is_archived: false,
      owner_type: 'blog',
      owner_id: blog.id,
    })
    .select('id, slug')
    .single();
  if (error || !inserted) return null;
  return {
    topicId: (inserted as { id: string }).id,
    topicSlug: (inserted as { slug: string }).slug,
  };
}

/**
 * Tears down all entity-scoped artefacts associated with a blog: its forum
 * space (cascades through forum_categories/forums/topics/posts via FK) and
 * its public-chat topic (cascades through public_chat_messages). Idempotent.
 * Uses the service-role client to bypass RLS on these tables. Call this
 * BEFORE deleting the blog row itself, so any FK chain rooted on blog.id is
 * removed first if needed.
 */
export async function tearDownBlogSideArtifacts(blogId: string): Promise<void> {
  const svc = getServiceClient();
  await Promise.allSettled([
    svc.from('forum_spaces').delete().eq('owner_type', 'blog').eq('owner_id', blogId),
    svc.from('public_chat_topics').delete().eq('owner_type', 'blog').eq('owner_id', blogId),
  ]);
}

export function mapBlog(
  row: BlogRow,
  ownersById: Map<string, OwnerProfile>,
  viewer: { userId: string | null; followingIds: Set<string> }
) {
  const owner = ownersById.get(row.owner_id);
  const ownerAuthor = {
    id: row.owner_id,
    name: [owner?.first_name, owner?.last_name].filter(Boolean).join(' ') || (owner?.username ?? ''),
    username: owner?.username ?? '',
    avatar: owner?.avatar_url ?? undefined,
  };

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    category: row.category ?? 'AMIGOS',
    subcategory: row.subcategory ?? undefined,
    profileImageUrl: row.profile_image_url ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    stats: {
      postsCount: 0,
      followersCount: 0,
      totalViews: 0,
      totalLikes: 0,
      ...(row.stats ?? {}),
    },
    owner: ownerAuthor,
    authors: [ownerAuthor],
    isFollowing: viewer.followingIds.has(row.id),
    isOwner: viewer.userId !== null && viewer.userId === row.owner_id,
    isAuthor: viewer.userId !== null && viewer.userId === row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isVerified: Boolean(row.is_verified),
    website: row.website ?? undefined,
    social: (row.social ?? {}) as Record<string, string>,
    tags: row.tags ?? [],
  };
}

import 'server-only';
import { getServiceClient } from '@/utils/supabase/server';

/**
 * Provision (or top up) a `forum_spaces` row for a community so the "Foros"
 * panel works out of the box — space + "General" category + default
 * "Discusión general" forum + owner admin role. Idempotent: safe to call
 * multiple times.
 *
 * Mirrors {@link import('@/lib/api/clubs').ensureClubForumSpace} for clubs.
 * Uses the service-role client because `forum_spaces` INSERT is RLS-gated to
 * `is_platform_admin() OR is_forum_owner_target(...)`; provisioning eagerly on
 * community creation (and backfilling existing communities) must not depend on
 * the caller being the owner in the current request context.
 */

function communityPrivacyToForumVisibility(
  privacy: string,
): 'public' | 'private' | 'secret' {
  switch (privacy) {
    case 'PRIVATE':
      return 'private';
    case 'SECRET':
      return 'secret';
    case 'PUBLIC':
    default:
      return 'public';
  }
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || `comunidad-${Date.now()}`
  );
}

export async function ensureCommunityForumSpace(community: {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  privacy: string;
}): Promise<{ spaceId: string; spaceSlug: string } | null> {
  const svc = getServiceClient();

  // 1. Space
  const { data: existing } = await svc
    .from('forum_spaces')
    .select('id, slug, enabled')
    .eq('owner_type', 'community')
    .eq('owner_id', community.id)
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
    const baseSlug = slugify(`comunidad-${community.slug || community.name}`);
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
        owner_type: 'community',
        owner_id: community.id,
        slug: candidate,
        name: community.name,
        visibility: communityPrivacyToForumVisibility(community.privacy),
        enabled: true,
        enabled_by: community.owner_id,
      })
      .select('id, slug')
      .single();
    if (insertErr || !inserted) return null;
    spaceId = (inserted as { id: string }).id;
    spaceSlug = (inserted as { slug: string }).slug;
  }

  // forum_categories.slug / forums.slug are namespaced with the space slug to
  // avoid collisions across spaces (forums.slug is globally UNIQUE).
  const categorySlug = `general-${spaceSlug}`;
  const forumSlug = `${spaceSlug}-discusion-general`;

  // 2. Default "General" category
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

  // 3. Default "Discusión general" forum inside the category
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
      description: 'Tema libre para todos los miembros de la comunidad.',
      position: 0,
    });
  }

  // 4. Owner admin role
  const { data: role } = await svc
    .from('forum_roles')
    .select('user_id')
    .eq('space_id', spaceId)
    .eq('user_id', community.owner_id)
    .maybeSingle();
  if (!role) {
    await svc.from('forum_roles').insert({
      space_id: spaceId,
      user_id: community.owner_id,
      role: 'admin',
      granted_by: community.owner_id,
    });
  }

  return { spaceId, spaceSlug };
}

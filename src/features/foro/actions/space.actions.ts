'use server'

import { getServerClient } from '@/utils/supabase/server'
import { getSpaceBoardByOwner } from '@/app/(app)/foro/server/foro.server'
import { ensureBlogForumSpace } from '@/lib/api/blogs'
import type { ForoCategory, ForoSpace, OwnerType } from '@/features/foro/types'

export async function getOwnerSpaceBoardAction(
  ownerType: OwnerType,
  ownerId: string,
): Promise<{ space: ForoSpace; categories: ForoCategory[] } | null> {
  if (!ownerId) return null
  return getSpaceBoardByOwner(ownerType, ownerId)
}

/**
 * Provisions a blog's forum space (idempotent) and returns the board.
 * Caller must verify the viewer owns the blog before invoking — RLS will
 * reject if the service-role insert ever lands in the wrong hands, but the
 * client-side gate also keeps the action invisible to non-owners.
 */
export async function ensureBlogForumSpaceAction(blog: {
  id: string
  name: string
  slug: string
  ownerId: string
}): Promise<{ space: ForoSpace; categories: ForoCategory[] } | null> {
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth?.user || auth.user.id !== blog.ownerId) return null
  await ensureBlogForumSpace({
    id: blog.id,
    name: blog.name,
    slug: blog.slug,
    owner_id: blog.ownerId,
  })
  return getSpaceBoardByOwner('blog', blog.id)
}

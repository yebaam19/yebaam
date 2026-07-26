'use server'

import { getServerClient } from '@/utils/supabase/server'
import { getSpaceBoardByOwner } from '@/app/(app)/foro/server/foro.server'
import { ensureBlogForumSpace, getBlogOwnerId } from '@/lib/api/blogs'
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
 *
 * Takes only the blog id. Ownership is decided by comparing the session against
 * the blog row's own `owner_id` — never against an id supplied by the caller.
 * The previous signature accepted `ownerId` and checked the session matched
 * *it*, which is trivially satisfied by sending your own uuid alongside someone
 * else's blog id; the service-role grant downstream then made the caller an
 * admin of that blog's forum. A Server Action is a plain RPC, so the fact that
 * the UI only renders this button for owners is not a control.
 */
export async function ensureBlogForumSpaceAction(
  blogId: string,
): Promise<{ space: ForoSpace; categories: ForoCategory[] } | null> {
  if (!blogId) return null
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth?.user) return null

  const ownerId = await getBlogOwnerId(blogId)
  if (!ownerId || ownerId !== auth.user.id) return null

  await ensureBlogForumSpace(blogId)
  return getSpaceBoardByOwner('blog', blogId)
}

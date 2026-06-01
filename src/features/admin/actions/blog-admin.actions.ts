'use server'

import { revalidatePath } from 'next/cache'
import { isPlatformAdmin } from '@/app/(app)/foro/server/foro.server'
import { getServerClient, getServiceClient } from '@/utils/supabase/server'

type Result = { ok: boolean; error?: string }

async function currentUserId(): Promise<string | null> {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  return data?.user?.id ?? null
}

/** Circle 1 (autenticación) + circle 2 (distinción): admin-set on a blog. */
export async function setBlogVerificationAction(input: {
  blogId: string
  isVerified: boolean
  distinction: 'local' | 'national' | 'international' | null
}): Promise<Result> {
  if (!(await isPlatformAdmin())) return { ok: false, error: 'No autorizado' }
  const svc = getServiceClient()
  const { error } = await svc
    .from('blogs')
    .update({
      is_verified: input.isVerified,
      distinction: input.distinction,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.blogId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/blogs')
  return { ok: true }
}

/** Grant a catalog badge to a blog's "franja de badges". */
export async function grantBlogBadgeAction(input: { blogId: string; badgeId: string }): Promise<Result> {
  if (!(await isPlatformAdmin())) return { ok: false, error: 'No autorizado' }
  const svc = getServiceClient()
  const grantedBy = await currentUserId()
  const { error } = await svc
    .from('blog_badges')
    .upsert(
      { blog_id: input.blogId, badge_id: input.badgeId, granted_by: grantedBy },
      { onConflict: 'blog_id,badge_id', ignoreDuplicates: true }
    )
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/blogs')
  return { ok: true }
}

/** Revoke a badge (by slug) from a blog. */
export async function revokeBlogBadgeAction(input: { blogId: string; badgeSlug: string }): Promise<Result> {
  if (!(await isPlatformAdmin())) return { ok: false, error: 'No autorizado' }
  const svc = getServiceClient()
  const { data: badge } = await svc.from('badges').select('id').eq('slug', input.badgeSlug).maybeSingle()
  const badgeId = (badge as { id: string } | null)?.id
  if (!badgeId) return { ok: false, error: 'Insignia no encontrada' }
  const { error } = await svc
    .from('blog_badges')
    .delete()
    .eq('blog_id', input.blogId)
    .eq('badge_id', badgeId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/blogs')
  return { ok: true }
}

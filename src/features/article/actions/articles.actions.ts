'use server'

/**
 * Server actions for personal (USER_PROFILE) articles.
 *
 * Persists to `public.articles` via the session-bound client (RLS enforces
 * author_id = auth.uid() on insert). Cover images are uploaded client-side to
 * Cloudflare Images; only the resulting `cf_image_id` is stored here.
 */

import { revalidatePath } from 'next/cache'
import {
  calculateReadTime,
  normalizeArticleFields,
  requireArticleSession,
  uniqueArticleSlug,
} from './_helpers'

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

export interface CreateArticleInput {
  title: string
  subtitle?: string
  content: string
  /** Cloudflare image id of an already-uploaded cover, or null/undefined for none. */
  cfImageId?: string | null
  tags?: string[]
  /** 'public' | 'private' — defaults to 'public'. */
  visibility?: 'public' | 'private'
}

export interface CreatedArticle {
  id: string
  slug: string
}

export async function createArticleAction(
  input: CreateArticleInput,
): Promise<ActionResult<CreatedArticle>> {
  const normalized = normalizeArticleFields(input)
  if (!normalized.ok) return normalized
  const { title, subtitle, content, tags } = normalized.fields

  const session = await requireArticleSession()
  if (!session) return { ok: false, error: 'No autenticado' }

  const cfImageId = input.cfImageId?.trim() || null
  const visibility = input.visibility === 'private' ? 'private' : 'public'
  const slug = await uniqueArticleSlug(title)

  const { data, error } = await session.client
    .from('articles')
    .insert({
      author_id: session.userId,
      title,
      subtitle,
      content,
      cf_image_id: cfImageId,
      tags,
      visibility,
      read_time: calculateReadTime(content),
      context_type: 'USER_PROFILE',
      context_id: null,
      slug,
    })
    .select('id, slug')
    .maybeSingle()

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo publicar el artículo.' }
  }

  const row = data as { id: string; slug: string }
  revalidatePath('/feed/article/[articleId]', 'page')
  revalidatePath('/feed')

  return { ok: true, data: { id: row.id, slug: row.slug } }
}

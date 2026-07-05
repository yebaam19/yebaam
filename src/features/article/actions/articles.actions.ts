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

export interface UpdateArticleInput {
  title: string
  subtitle?: string
  content: string
  tags?: string[]
  /** 'public' | 'private' — omit to keep the current visibility. */
  visibility?: 'public' | 'private'
  /**
   * Cover semantics: omit/undefined = keep the current cover; a Cloudflare
   * image id = replace it; null = remove it.
   */
  cfImageId?: string | null
}

export interface UpdatedArticle {
  id: string
  slug: string
}

export async function updateArticleAction(
  articleId: string,
  input: UpdateArticleInput,
): Promise<ActionResult<UpdatedArticle>> {
  const id = (articleId ?? '').trim()
  if (!id) return { ok: false, error: 'Artículo no válido.' }

  const normalized = normalizeArticleFields(input)
  if (!normalized.ok) return normalized
  const { title, subtitle, content, tags } = normalized.fields

  const session = await requireArticleSession()
  if (!session) return { ok: false, error: 'No autenticado' }

  // Ownership check up front (RLS also guards the UPDATE, but this way the
  // caller gets a real error instead of a silent 0-row update).
  const { data: existingRow, error: readError } = await session.client
    .from('articles')
    .select('id, author_id, title, slug')
    .eq('id', id)
    .maybeSingle()

  if (readError) return { ok: false, error: readError.message }
  if (!existingRow) return { ok: false, error: 'Artículo no encontrado.' }

  const existing = existingRow as { id: string; author_id: string; title: string; slug: string }
  if (existing.author_id !== session.userId) {
    return { ok: false, error: 'No tienes permisos para editar este artículo.' }
  }

  // Only re-slug when the title actually changed, so stable links keep working.
  const slug = title === existing.title ? existing.slug : await uniqueArticleSlug(title, id)

  const patch: Record<string, unknown> = {
    title,
    subtitle,
    content,
    tags,
    slug,
    read_time: calculateReadTime(content),
    updated_at: new Date().toISOString(),
  }
  if (input.visibility === 'private' || input.visibility === 'public') {
    patch.visibility = input.visibility
  }
  if (input.cfImageId !== undefined) {
    patch.cf_image_id = input.cfImageId?.trim() || null
  }

  const { data, error } = await session.client
    .from('articles')
    .update(patch)
    .eq('id', id)
    .eq('author_id', session.userId)
    .select('id, slug')
    .maybeSingle()

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo actualizar el artículo.' }
  }

  const row = data as { id: string; slug: string }
  revalidatePath('/feed/article/[articleId]', 'page')
  revalidatePath('/feed')

  return { ok: true, data: { id: row.id, slug: row.slug } }
}

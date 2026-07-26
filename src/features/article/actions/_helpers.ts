import 'server-only'

import { getServerClient, getServiceClient } from '@/utils/supabase/server'
import { sanitizeRichText } from '@/lib/html/sanitize-rich-text'

/**
 * Shared helpers for the personal-article server actions. Article persistence
 * lives in `public.articles` (context_type='USER_PROFILE'); these mirror the
 * communities article helpers but key uniqueness on the global `slug` column
 * (which has a UNIQUE constraint) instead of per-community.
 */

const MAX_TITLE = 160
const MAX_SUBTITLE = 240
const MIN_CONTENT = 20 // measured after stripping tags
const MAX_CONTENT = 200_000

export type ArticleSession = {
  userId: string
  client: Awaited<ReturnType<typeof getServerClient>>
}

/** Current authenticated user + RLS-scoped client, or null when signed out. */
export async function requireArticleSession(): Promise<ArticleSession | null> {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) return null
  return { userId: data.user.id, client }
}

export function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function calculateReadTime(html: string): number {
  const words = stripTags(html).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120) || `articulo-${Date.now()}`
  )
}

export type NormalizedFields = {
  title: string
  subtitle: string | null
  content: string
  tags: string[]
}

/** Trim + bound-check the user-supplied article fields shared by create/update. */
export function normalizeArticleFields(input: {
  title?: string
  subtitle?: string
  content?: string
  tags?: string[]
}): { ok: true; fields: NormalizedFields } | { ok: false; error: string } {
  const title = (input.title ?? '').trim()
  const subtitle = (input.subtitle ?? '').trim()
  // Sanitize before the length/emptiness checks so the bounds apply to what is
  // actually stored, and a body that is nothing but stripped markup is caught
  // by the MIN_CONTENT check rather than saved as an empty article.
  const content = sanitizeRichText((input.content ?? '').trim())
  const tags = (input.tags ?? [])
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12)

  if (!title) return { ok: false, error: 'El título es obligatorio.' }
  if (title.length > MAX_TITLE) return { ok: false, error: 'El título es demasiado largo.' }
  if (subtitle.length > MAX_SUBTITLE) return { ok: false, error: 'El subtítulo es demasiado largo.' }
  if (!content || content === '<p></p>') return { ok: false, error: 'El contenido es obligatorio.' }
  if (content.length > MAX_CONTENT) return { ok: false, error: 'El contenido es demasiado largo.' }
  if (stripTags(content).length < MIN_CONTENT) {
    return { ok: false, error: 'El contenido es demasiado corto.' }
  }

  return { ok: true, fields: { title, subtitle: subtitle || null, content, tags } }
}

/**
 * Resolve a slug unique against the global `articles.slug` UNIQUE column by
 * appending `-2`, `-3`, …. Uses the service role so public/private rows hidden
 * by RLS are still detected (a clash on the unique index would 23505 otherwise).
 * Pass `ignoreId` when re-slugging an existing article so it doesn't collide
 * with itself.
 */
export async function uniqueArticleSlug(title: string, ignoreId?: string): Promise<string> {
  const svc = getServiceClient()
  const baseSlug = slugifyTitle(title)
  let slug = baseSlug
  for (let i = 2; i < 50; i += 1) {
    let query = svc.from('articles').select('id').eq('slug', slug)
    if (ignoreId) query = query.neq('id', ignoreId)
    const { data: clash } = await query.maybeSingle()
    if (!clash) break
    slug = `${baseSlug}-${i}`
  }
  return slug
}

import 'server-only'

import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import { withImageVariant } from '@/lib/media/urls'
import { sanitizeRichText } from '@/lib/html/sanitize-rich-text'
import {
  ArticleContextType,
  ArticleVisibility,
  type Article,
  type ArticleAuthor,
} from '../interfaces'

const CF_ACCOUNT_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

function cfImageUrl(id: string | null | undefined): string | null {
  if (!id || !CF_ACCOUNT_HASH) return null
  return `https://imagedelivery.net/${CF_ACCOUNT_HASH}/${id}/public`
}

interface DbArticleRow {
  id: string
  author_id: string
  title: string
  subtitle: string | null
  content: string
  cf_image_id: string | null
  slug: string
  tags: string[] | null
  visibility: string | null
  read_time: number | null
  context_type: string | null
  context_id: string | null
  views: number | null
  created_at: string
  updated_at: string
  published_at: string | null
}

interface DbProfileRow {
  id: string
  username: string | null
  display_name: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  is_verified: boolean | null
}

function buildSummary(html: string): string {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > 220 ? text.slice(0, 217) + '...' : text
}

function mapContextType(value: string | null): ArticleContextType {
  switch (value) {
    case 'BLOG':
      return ArticleContextType.BLOG
    case 'CLUB':
      return ArticleContextType.CLUB
    case 'PROFESSIONAL':
      return ArticleContextType.PROFESSIONAL
    default:
      return ArticleContextType.USER_PROFILE
  }
}

function mapVisibility(value: string | null): ArticleVisibility {
  return value === 'private' ? ArticleVisibility.PRIVATE : ArticleVisibility.PUBLIC
}

function mapAuthor(row: DbProfileRow | null, fallbackId: string): ArticleAuthor {
  if (!row) {
    return { id: fallbackId, username: '', displayName: '', avatarUrl: null }
  }
  const displayName =
    row.display_name ?? [row.first_name, row.last_name].filter(Boolean).join(' ') ?? row.username ?? ''
  return {
    id: row.id,
    username: row.username ?? '',
    displayName: displayName || row.username || '',
    avatarUrl: row.avatar_url ? withImageVariant(row.avatar_url, 'avatar') : null,
    isVerified: row.is_verified === true,
  }
}

function mapRowToArticle(row: DbArticleRow, author: ArticleAuthor): Article {
  // Sanitized on write too (normalizeArticleFields). Repeated here because this
  // is the value handed to dangerouslySetInnerHTML, and rows predating the
  // write-side sanitizer would otherwise still execute.
  const content = sanitizeRichText(row.content)
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    headerImageUrl: cfImageUrl(row.cf_image_id),
    content,
    summary: buildSummary(content),
    authorId: row.author_id,
    contextType: mapContextType(row.context_type),
    contextId: row.context_id,
    visibility: mapVisibility(row.visibility),
    slug: row.slug,
    readTime: row.read_time,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    author,
    media: [],
    likes: [],
    bookmarks: [],
    _count: { likes: 0, comments: 0, views: row.views ?? 0 },
  }
}

/**
 * Load a single article by id, mapped to the `Article` shape consumed by
 * `ArticleView`. RLS restricts visibility to public articles or the owner's own
 * private ones. Returns null when the row is missing or hidden.
 */
export const getArticleById = cache(async (id: string): Promise<Article | null> => {
  const client = await getServerClient()

  const { data: articleRow } = await client
    .from('articles')
    .select(
      'id, author_id, title, subtitle, content, cf_image_id, slug, tags, visibility, read_time, context_type, context_id, views, created_at, updated_at, published_at',
    )
    .eq('id', id)
    .maybeSingle()

  const row = articleRow as DbArticleRow | null
  if (!row) return null

  const { data: profileRow } = await client
    .from('profiles')
    .select('id, username, display_name, first_name, last_name, avatar_url, is_verified')
    .eq('id', row.author_id)
    .maybeSingle()

  return mapRowToArticle(row, mapAuthor(profileRow as DbProfileRow | null, row.author_id))
})

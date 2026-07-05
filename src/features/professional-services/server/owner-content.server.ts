import 'server-only'

import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import { fromPostMedia } from '@/lib/media/parse'
import { cfImage } from './_shared'

/**
 * Contenido público del dueño de un servicio profesional: sus publicaciones
 * (tabla `posts`) y sus artículos (tabla `articles`). Solo lecturas — el RLS de
 * ambas tablas ya limita lo visible a filas públicas o propias, pero filtramos
 * explícitamente por visibilidad pública para que el perfil muestre lo mismo a
 * cualquier visitante.
 */

// ----------------------------------------------------------------------------
// Posts públicos del dueño
// ----------------------------------------------------------------------------

interface OwnerPostRow {
  id: string
  content: string | null
  media_files: unknown
  reactions_count: unknown
  comments_count: number | null
  created_at: string
}

/** Primer medio de la publicación, ya resuelto para la tarjeta compacta. */
export type OwnerPostMedia =
  | { kind: 'image'; url: string }
  | { kind: 'video'; streamUid: string; thumbnailUrl: string | null }

export interface OwnerPostCard {
  id: string
  content: string
  createdAt: string
  media: OwnerPostMedia | null
  commentsCount: number
  reactionsCount: number
}

/** Suma el JSONB `reactions_count` ({ like, love, ... }) a un total simple. */
function sumReactions(raw: unknown): number {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return 0
  let total = 0
  for (const value of Object.values(raw as Record<string, unknown>)) {
    if (typeof value === 'number' && Number.isFinite(value)) total += value
  }
  return total
}

function firstMedia(raw: unknown): OwnerPostMedia | null {
  const [item] = fromPostMedia(raw)
  if (!item) return null
  if (item.kind === 'video') {
    return { kind: 'video', streamUid: item.cfId, thumbnailUrl: item.thumbnailUrl ?? null }
  }
  const url = cfImage(item.cfId, 'thumbnail')
  return url ? { kind: 'image', url } : null
}

function mapPostRow(row: OwnerPostRow): OwnerPostCard {
  return {
    id: row.id,
    content: row.content ?? '',
    createdAt: row.created_at,
    media: firstMedia(row.media_files),
    commentsCount: row.comments_count ?? 0,
    reactionsCount: sumReactions(row.reactions_count),
  }
}

/**
 * Publicaciones públicas recientes del dueño para el perfil del servicio.
 * Excluye posts de muro (blog/negocio) igual que el feed (`/api/posts`), para
 * que aquí solo aparezca lo que el autor publicó en su propio perfil.
 */
export const getOwnerPublicPosts = cache(
  async (userId: string, limit = 3): Promise<OwnerPostCard[]> => {
    const client = await getServerClient()
    const { data, error } = await client
      .from('posts')
      .select('id, content, media_files, reactions_count, comments_count, created_at')
      .eq('author_id', userId)
      .eq('privacy', 'public')
      .is('blog_id', null)
      .is('business_id', null)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) {
      console.error('[professional-services] getOwnerPublicPosts read failed:', error.message)
    }
    return ((data ?? []) as OwnerPostRow[]).map(mapPostRow)
  },
)

// ----------------------------------------------------------------------------
// Artículos publicados del dueño
// ----------------------------------------------------------------------------

interface OwnerArticleRow {
  id: string
  title: string
  subtitle: string | null
  slug: string
  cf_image_id: string | null
  read_time: number | null
  published_at: string | null
  created_at: string
}

export interface OwnerArticleCard {
  id: string
  title: string
  subtitle: string | null
  slug: string
  /** Cloudflare Images id de la portada; la UI construye la URL (`imageUrl`). */
  cfImageId: string | null
  readTime: number | null
  publishedAt: string
}

/**
 * Artículos visibles públicamente del dueño (semántica del feature `article`:
 * `visibility = 'public'`; `published_at` tiene default `now()`), del más
 * reciente al más antiguo.
 */
export const getOwnerPublishedArticles = cache(
  async (userId: string, limit = 6): Promise<OwnerArticleCard[]> => {
    const client = await getServerClient()
    const { data, error } = await client
      .from('articles')
      .select('id, title, subtitle, slug, cf_image_id, read_time, published_at, created_at')
      .eq('author_id', userId)
      .eq('visibility', 'public')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit)
    if (error) {
      console.error('[professional-services] getOwnerPublishedArticles read failed:', error.message)
    }
    return ((data ?? []) as OwnerArticleRow[]).map((row) => ({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      slug: row.slug,
      cfImageId: row.cf_image_id,
      readTime: row.read_time,
      publishedAt: row.published_at ?? row.created_at,
    }))
  },
)

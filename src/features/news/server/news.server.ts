import 'server-only'

import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import { imageUrl } from '@/lib/media/urls'
import type { NewsAd, NewsArticle, NewsComment, NewsModuleSettings, NewsReplica, NewsScope, NewsSection, NewsSource } from '../types'

const DEFAULT_SETTINGS: NewsModuleSettings = {
  newsEnabled: true,
  videosEnabled: true,
  weatherEnabled: true,
  trendsEnabled: true,
  adsEnabled: true,
}

function displayName(profile: Record<string, unknown> | null, fallback: string): string {
  if (!profile) return fallback
  const display = typeof profile.display_name === 'string' ? profile.display_name : ''
  const fullName = [profile.first_name, profile.last_name].filter((part): part is string => typeof part === 'string').join(' ')
  return display || fullName || (typeof profile.username === 'string' ? profile.username : fallback)
}

function toArticle(row: Record<string, unknown>, counts: { reactions: number; comments: number }): NewsArticle {
  const section = row.news_sections as Record<string, unknown> | null
  const source = row.news_sources as Record<string, unknown> | null
  const profile = row.profiles as Record<string, unknown> | null
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    excerpt: String(row.excerpt),
    content: typeof row.content === 'string' ? row.content : undefined,
    coverCfImageId: typeof row.cover_cf_image_id === 'string' ? row.cover_cf_image_id : null,
    videoStreamUid: typeof row.video_stream_uid === 'string' ? row.video_stream_uid : null,
    scope: row.scope as NewsScope,
    isFeatured: row.is_featured === true,
    isSponsored: row.is_sponsored === true,
    aiDisclosure: row.ai_disclosure === true,
    publishedAt: String(row.published_at),
    section: { id: String(section?.id ?? ''), slug: String(section?.slug ?? ''), name: String(section?.name ?? 'Actualidad') },
    source: { id: String(source?.id ?? ''), name: String(source?.name ?? 'Fuente autorizada'), websiteUrl: typeof source?.website_url === 'string' ? source.website_url : null },
    author: {
      id: String(profile?.id ?? row.author_id),
      name: displayName(profile, 'Autor verificado'),
      username: typeof profile?.username === 'string' ? profile.username : null,
      avatarUrl: typeof profile?.avatar_url === 'string' ? profile.avatar_url : null,
    },
    reactionCount: counts.reactions,
    commentCount: counts.comments,
  }
}

async function getCounts(client: Awaited<ReturnType<typeof getServerClient>>, ids: string[]) {
  const reactionCounts = new Map<string, number>()
  const commentCounts = new Map<string, number>()
  if (!ids.length) return { reactionCounts, commentCounts }
  const [reactions, comments] = await Promise.all([
    client.from('news_reactions').select('article_id').in('article_id', ids),
    client.from('news_comments').select('article_id').in('article_id', ids).eq('status', 'visible'),
  ])
  for (const row of (reactions.data ?? []) as Array<{ article_id: string }>) reactionCounts.set(row.article_id, (reactionCounts.get(row.article_id) ?? 0) + 1)
  for (const row of (comments.data ?? []) as Array<{ article_id: string }>) commentCounts.set(row.article_id, (commentCounts.get(row.article_id) ?? 0) + 1)
  return { reactionCounts, commentCounts }
}

export const getNewsSettings = cache(async (): Promise<NewsModuleSettings> => {
  const client = await getServerClient()
  const { data } = await client.from('news_module_settings').select('news_enabled, videos_enabled, weather_enabled, trends_enabled, ads_enabled').maybeSingle()
  if (!data) return DEFAULT_SETTINGS
  const row = data as Record<string, boolean>
  return { newsEnabled: row.news_enabled, videosEnabled: row.videos_enabled, weatherEnabled: row.weather_enabled, trendsEnabled: row.trends_enabled, adsEnabled: row.ads_enabled }
})

export const getNewsSections = cache(async (): Promise<NewsSection[]> => {
  const client = await getServerClient()
  const { data } = await client.from('news_sections').select('id, slug, name').eq('is_active', true).order('position')
  return (data ?? []) as NewsSection[]
})

export const getNewsSource = cache(async (sourceId: string): Promise<NewsSource | null> => {
  const client = await getServerClient()
  const { data } = await client
    .from('news_sources')
    .select('id, name, website_url')
    .eq('id', sourceId)
    .eq('status', 'approved')
    .maybeSingle()
  if (!data) return null
  return { id: data.id, name: data.name, websiteUrl: data.website_url }
})

export const getNewsFeed = cache(async (filters: { section?: string; scope?: NewsScope; cityId?: string; includeNationalInternational?: boolean; sourceId?: string; articleIds?: string[]; limit?: number } = {}): Promise<NewsArticle[]> => {
  const client = await getServerClient()
  let query = client
    .from('news_articles')
    .select('id, slug, title, excerpt, cover_cf_image_id, video_stream_uid, scope, is_featured, is_sponsored, ai_disclosure, published_at, author_id, news_sections!inner(id, slug, name), news_sources!inner(id, name, website_url), profiles!news_articles_author_id_fkey(id, username, display_name, first_name, last_name, avatar_url)')
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(Math.min(filters.limit ?? 18, 50))
  if (filters.scope) query = query.eq('scope', filters.scope)
  if (filters.cityId && filters.includeNationalInternational) query = query.or(`city_id.eq.${filters.cityId},scope.in.(national,international)`)
  else if (filters.cityId) query = query.eq('city_id', filters.cityId)
  if (filters.sourceId) query = query.eq('source_id', filters.sourceId)
  if (filters.section) query = query.eq('news_sections.slug', filters.section)
  if (filters.articleIds?.length) query = query.in('id', filters.articleIds)
  const { data } = await query
  const rows = (data ?? []) as Record<string, unknown>[]
  const counts = await getCounts(client, rows.map((row) => String(row.id)))
  return rows.map((row) => toArticle(row, { reactions: counts.reactionCounts.get(String(row.id)) ?? 0, comments: counts.commentCounts.get(String(row.id)) ?? 0 }))
})

export const getRecommendedNews = cache(async (limit = 6): Promise<NewsArticle[]> => {
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return []
  const { data } = await client
    .from('news_recommendations')
    .select('article_id')
    .eq('user_id', auth.user.id)
    .order('score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 12))
  const ids = ((data ?? []) as Array<{ article_id: string }>).map((row) => row.article_id)
  return ids.length ? getNewsFeed({ articleIds: ids, limit }) : []
})

export const getActiveNewsAds = cache(async (): Promise<NewsAd[]> => {
  const client = await getServerClient()
  const now = new Date().toISOString()
  const { data } = await client.from('news_ads').select('id, advertiser_name, headline, destination_url, image_cf_image_id').eq('status', 'active').lte('starts_at', now).gte('ends_at', now).limit(4)
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({ id: String(row.id), advertiserName: String(row.advertiser_name), headline: String(row.headline), destinationUrl: String(row.destination_url), imageCfImageId: typeof row.image_cf_image_id === 'string' ? row.image_cf_image_id : null }))
})

export const getNewsArticle = cache(async (slug: string): Promise<NewsArticle | null> => {
  const client = await getServerClient()
  const { data } = await client
    .from('news_articles')
    .select('id, slug, title, excerpt, content, cover_cf_image_id, video_stream_uid, scope, is_featured, is_sponsored, ai_disclosure, published_at, author_id, news_sections!inner(id, slug, name), news_sources!inner(id, name, website_url), profiles!news_articles_author_id_fkey(id, username, display_name, first_name, last_name, avatar_url)')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  if (!data) return null
  const id = String((data as Record<string, unknown>).id)
  const { data: auth } = await client.auth.getUser()
  const userId = auth.user?.id
  const [counts, reaction, save] = await Promise.all([
    getCounts(client, [id]),
    userId ? client.from('news_reactions').select('article_id').eq('article_id', id).eq('user_id', userId).eq('kind', 'like').maybeSingle() : Promise.resolve({ data: null }),
    userId ? client.from('news_saves').select('article_id').eq('article_id', id).eq('user_id', userId).maybeSingle() : Promise.resolve({ data: null }),
  ])
  return {
    ...toArticle(data as Record<string, unknown>, { reactions: counts.reactionCounts.get(id) ?? 0, comments: counts.commentCounts.get(id) ?? 0 }),
    viewerLiked: Boolean(reaction.data),
    viewerSaved: Boolean(save.data),
  }
})

export const getNewsComments = cache(async (articleId: string): Promise<NewsComment[]> => {
  const client = await getServerClient()
  const { data } = await client
    .from('news_comments')
    .select('id, content, created_at, author_id, profiles!news_comments_author_id_fkey(id, username, display_name, first_name, last_name, avatar_url)')
    .eq('article_id', articleId)
    .eq('status', 'visible')
    .order('created_at')
  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const profile = row.profiles as Record<string, unknown> | null
    return { id: String(row.id), content: String(row.content), createdAt: String(row.created_at), author: { id: String(profile?.id ?? row.author_id), name: displayName(profile, 'Usuario'), avatarUrl: typeof profile?.avatar_url === 'string' ? profile.avatar_url : null } }
  })
})

export const getNewsReplicas = cache(async (articleId: string): Promise<NewsReplica[]> => {
  const client = await getServerClient()
  const { data } = await client.from('news_replicas').select('id, entity_type, entity_id').eq('article_id', articleId).eq('status', 'approved')
  const rows = (data ?? []) as Array<{ id: string; entity_type: NewsReplica['entityType']; entity_id: string }>
  if (!rows.length) return []

  const professionalIds = rows.filter((row) => row.entity_type === 'professional_profile').map((row) => row.entity_id)
  const pageIds = rows.filter((row) => row.entity_type !== 'professional_profile').map((row) => row.entity_id)
  const [professionalResult, pageResult] = await Promise.all([
    professionalIds.length ? client.from('professional_profiles').select('id, user_id').in('id', professionalIds) : Promise.resolve({ data: [] }),
    pageIds.length ? client.from('pages').select('id, name, slug, is_verified').in('id', pageIds).eq('is_verified', true) : Promise.resolve({ data: [] }),
  ])
  const professionalRows = (professionalResult.data ?? []) as Array<{ id: string; user_id: string }>
  const userIds = professionalRows.map((row) => row.user_id)
  const { data: profileData } = userIds.length
    ? await client.from('profiles').select('id, username, display_name, first_name, last_name').in('id', userIds)
    : { data: [] }
  const profiles = new Map(((profileData ?? []) as Record<string, unknown>[]).map((profile) => [String(profile.id), profile]))
  const professionals = new Map(professionalRows.map((row) => {
    const profile = profiles.get(row.user_id) ?? null
    const username = typeof profile?.username === 'string' ? profile.username : null
    return [row.id, { name: displayName(profile, 'Perfil profesional verificado'), href: username ? `/feed/professional-profile/${username}` : null }]
  }))
  const pages = new Map(((pageResult.data ?? []) as Array<{ id: string; name: string; slug: string }>).map((page) => [page.id, { name: page.name, href: `/paginas/${page.slug}` }]))

  return rows.flatMap((row) => {
    const entity = row.entity_type === 'professional_profile' ? professionals.get(row.entity_id) : pages.get(row.entity_id)
    return entity ? [{ id: row.id, entityType: row.entity_type, entityId: row.entity_id, ...entity }] : []
  })
})

export function newsCoverUrl(id: string | null): string | null {
  return id ? imageUrl(id, 'public') : null
}

import 'server-only'

import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import type { NewsReplicaEntity } from '../types'

export interface MyNewsSource { id: string; name: string; status: 'pending' | 'approved' | 'suspended' }
export interface CityNewsSource extends MyNewsSource { ownerName: string; websiteUrl: string | null }

export const getMyNewsSources = cache(async (): Promise<MyNewsSource[]> => {
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return []
  const { data } = await client.from('news_sources').select('id, name, status').eq('owner_id', auth.user.id).order('created_at', { ascending: false })
  return (data ?? []) as MyNewsSource[]
})

export const getNewsAuthorEligibility = cache(async () => {
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return { signedIn: false, eligible: false }
  const { data } = await client.rpc('has_verified_professional_profile')
  return { signedIn: true, eligible: data === true }
})

export const canManageCityNews = cache(async (cityId: string): Promise<boolean> => {
  const client = await getServerClient()
  const { data } = await client.rpc('news_is_city_manager', { p_city_id: cityId })
  return data === true
})

export const getCityNewsSources = cache(async (cityId: string): Promise<CityNewsSource[]> => {
  if (!(await canManageCityNews(cityId))) return []
  const client = await getServerClient()
  const { data } = await client.from('news_sources').select('id, name, status, website_url, profiles!news_sources_owner_id_fkey(display_name, first_name, last_name, username)').eq('city_id', cityId).order('created_at', { ascending: false })
  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const profile = row.profiles as Record<string, string | null> | null
    const ownerName = profile?.display_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.username || 'Usuario'
    return { id: String(row.id), name: String(row.name), status: row.status as CityNewsSource['status'], websiteUrl: typeof row.website_url === 'string' ? row.website_url : null, ownerName }
  })
})

export const getMyNewsReplicaEntities = cache(async (): Promise<NewsReplicaEntity[]> => {
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return []

  const [professionalResult, pageResult, profileResult] = await Promise.all([
    client.from('professional_profiles').select('id').eq('user_id', auth.user.id).maybeSingle(),
    client.from('pages').select('id, name').eq('owner_id', auth.user.id).eq('is_verified', true).order('name'),
    client.from('profiles').select('display_name, first_name, last_name, username').eq('id', auth.user.id).maybeSingle(),
  ])
  const entities: NewsReplicaEntity[] = ((pageResult.data ?? []) as Array<{ id: string; name: string }>).map((page) => ({ id: page.id, type: 'page', name: page.name }))

  if (professionalResult.data) {
    const [{ data: title }, { data: study }] = await Promise.all([
      client.from('professional_profile_titles').select('id').eq('professional_profile_id', professionalResult.data.id).eq('credential_status', 'approved').limit(1).maybeSingle(),
      client.from('professional_profile_studies').select('id').eq('professional_profile_id', professionalResult.data.id).eq('credential_status', 'approved').limit(1).maybeSingle(),
    ])
    if (title || study) {
      const profile = profileResult.data as Record<string, unknown> | null
      const name = profile?.display_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.username || 'Mi perfil profesional'
      entities.unshift({ id: professionalResult.data.id, type: 'professional_profile', name: String(name) })
    }
  }
  return entities
})

export interface AdminNewsSource { id: string; name: string; status: 'pending' | 'approved' | 'suspended'; ownerName: string; websiteUrl: string | null }

export interface AdminNewsArticle { id: string; title: string; status: 'draft' | 'published' | 'removed'; isFeatured: boolean; publishedAt: string | null }
export interface AdminNewsReplica { id: string; articleTitle: string; entityType: string; entityId: string; status: 'pending' | 'approved' | 'rejected' }
export interface AdminNewsSection { id: string; name: string; slug: string; isActive: boolean }
export interface AdminNewsAdSlot { id: string; label: string; placement: string }

export const getAdminNewsSources = cache(async (): Promise<AdminNewsSource[]> => {
  const client = await getServerClient()
  const { data } = await client.from('news_sources').select('id, name, status, website_url, owner_id, profiles!news_sources_owner_id_fkey(display_name, first_name, last_name, username)').order('created_at', { ascending: false })
  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const p = row.profiles as Record<string, string | null> | null
    const ownerName = p?.display_name || [p?.first_name, p?.last_name].filter(Boolean).join(' ') || p?.username || 'Usuario'
    return { id: String(row.id), name: String(row.name), status: row.status as AdminNewsSource['status'], websiteUrl: typeof row.website_url === 'string' ? row.website_url : null, ownerName }
  })
})

export const getAdminNewsArticles = cache(async (): Promise<AdminNewsArticle[]> => {
  const client = await getServerClient()
  const { data } = await client.from('news_articles').select('id, title, status, is_featured, published_at').order('created_at', { ascending: false }).limit(100)
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({ id: String(row.id), title: String(row.title), status: row.status as AdminNewsArticle['status'], isFeatured: row.is_featured === true, publishedAt: typeof row.published_at === 'string' ? row.published_at : null }))
})

export const getAdminNewsReplicas = cache(async (): Promise<AdminNewsReplica[]> => {
  const client = await getServerClient()
  const { data } = await client.from('news_replicas').select('id, entity_type, entity_id, status, news_articles!inner(title)').eq('status', 'pending').order('created_at', { ascending: false })
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({ id: String(row.id), articleTitle: String((row.news_articles as Record<string, unknown>)?.title ?? 'Noticia'), entityType: String(row.entity_type), entityId: String(row.entity_id), status: row.status as AdminNewsReplica['status'] }))
})

export const getAdminNewsSections = cache(async (): Promise<AdminNewsSection[]> => {
  const client = await getServerClient()
  const { data } = await client.from('news_sections').select('id, name, slug, is_active').order('position')
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({ id: String(row.id), name: String(row.name), slug: String(row.slug), isActive: row.is_active === true }))
})

export const getAdminNewsAdSlots = cache(async (): Promise<AdminNewsAdSlot[]> => {
  const client = await getServerClient()
  const { data } = await client.from('news_ad_slots').select('id, label, placement').eq('is_enabled', true).order('placement')
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({ id: String(row.id), label: String(row.label), placement: String(row.placement) }))
})

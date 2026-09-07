'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient, getServiceClient } from '@/utils/supabase/server'
import { sanitizeRichText } from '@/lib/html/sanitize-rich-text'
import { isPlatformAdmin } from '@/app/(app)/foro/server/foro.server'
import type { NewsScope } from '../types'

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string }

const SCOPES = new Set<NewsScope>(['local', 'regional', 'national', 'international'])

// News media columns intentionally contain only Cloudflare identifiers. The
// browser upload service returns these ids, but validate again on the server
// so a forged action cannot persist a Supabase, S3, or arbitrary URL reference.
const CLOUDFLARE_ID = /^[A-Za-z0-9_-]{3,256}$/

function validCloudflareId(value: string | null | undefined): string | null {
  if (!value) return null
  const id = value.trim()
  return CLOUDFLARE_ID.test(id) ? id : null
}

function slugify(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 110) || `noticia-${Date.now()}`
}

async function uniqueSlug(title: string): Promise<string> {
  const client = getServiceClient()
  const base = slugify(title)
  for (let suffix = 1; suffix < 50; suffix += 1) {
    const slug = suffix === 1 ? base : `${base}-${suffix}`
    const { data } = await client.from('news_articles').select('id').eq('slug', slug).maybeSingle()
    if (!data) return slug
  }
  return `${base}-${Date.now()}`
}

async function session() {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  return data.user ? { client, userId: data.user.id } : null
}

export async function createNewsSourceAction(input: { name: string; websiteUrl?: string; cityId?: string | null }): Promise<Result> {
  const current = await session()
  if (!current) return { ok: false, error: 'Inicia sesión para registrar una fuente.' }
  const name = input.name.trim()
  if (name.length < 2 || name.length > 160) return { ok: false, error: 'El nombre de la fuente debe tener entre 2 y 160 caracteres.' }
  const { error } = await current.client.from('news_sources').insert({ name, website_url: input.websiteUrl?.trim() || null, city_id: input.cityId || null, owner_id: current.userId })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/noticias/crear')
  revalidatePath('/admin/noticias')
  return { ok: true }
}

export async function createNewsArticleAction(input: { title: string; excerpt: string; content: string; sectionId: string; sourceId: string; scope: NewsScope; cityId?: string | null; coverCfImageId?: string | null; videoStreamUid?: string | null; isSponsored?: boolean; aiDisclosure?: boolean }): Promise<Result<{ slug: string }>> {
  const current = await session()
  if (!current) return { ok: false, error: 'Inicia sesión para publicar.' }
  const title = input.title.trim()
  const excerpt = input.excerpt.trim()
  const content = sanitizeRichText(input.content.trim())
  if (title.length < 5 || title.length > 180) return { ok: false, error: 'El título debe tener entre 5 y 180 caracteres.' }
  if (excerpt.length < 20 || excerpt.length > 500) return { ok: false, error: 'El resumen debe tener entre 20 y 500 caracteres.' }
  if (content.replace(/<[^>]*>/g, '').trim().length < 80) return { ok: false, error: 'El contenido debe tener al menos 80 caracteres.' }
  if (!SCOPES.has(input.scope)) return { ok: false, error: 'El alcance no es válido.' }
  if (input.isSponsored && !/#(?:Publicidad|Patrocinio)\b/i.test(content)) return { ok: false, error: 'Incluye #Publicidad o #Patrocinio en el contenido patrocinado.' }
  if (input.coverCfImageId && !validCloudflareId(input.coverCfImageId)) return { ok: false, error: 'La portada debe ser una imagen de Cloudflare válida.' }
  if (input.videoStreamUid && !validCloudflareId(input.videoStreamUid)) return { ok: false, error: 'El video debe ser un recurso de Cloudflare Stream válido.' }
  const cityId = input.cityId?.trim() || null
  if ((input.scope === 'local' || input.scope === 'regional') && !cityId) return { ok: false, error: 'Selecciona la ciudad de la noticia.' }
  if (cityId) {
    const { data: city } = await current.client.from('cities').select('id').eq('id', cityId).maybeSingle()
    if (!city) return { ok: false, error: 'La ciudad seleccionada no es válida.' }
  }
  const { data: settings } = await current.client.from('news_module_settings').select('news_enabled, videos_enabled').eq('singleton', true).maybeSingle()
  if (settings?.news_enabled === false) return { ok: false, error: 'La publicación de noticias está desactivada.' }
  if (input.videoStreamUid && settings?.videos_enabled === false) return { ok: false, error: 'La publicación de videos está desactivada.' }
  const slug = await uniqueSlug(title)
  const { error } = await current.client.from('news_articles').insert({
    slug, title, excerpt, content, section_id: input.sectionId, source_id: input.sourceId,
    author_id: current.userId, scope: input.scope, city_id: input.scope === 'local' || input.scope === 'regional' ? cityId : null,
    cover_cf_image_id: validCloudflareId(input.coverCfImageId), video_stream_uid: validCloudflareId(input.videoStreamUid),
    is_sponsored: input.isSponsored === true, ai_disclosure: input.aiDisclosure === true,
    status: 'published', published_at: new Date().toISOString(),
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/noticias')
  revalidatePath('/cities/[slug]/news', 'page')
  return { ok: true, data: { slug } }
}

export async function setNewsSourceStatusAction(input: { sourceId: string; status: 'approved' | 'suspended' }): Promise<Result> {
  const client = await getServerClient()
  const { data: source } = await client.from('news_sources').select('city_id').eq('id', input.sourceId).maybeSingle()
  let allowed = await isPlatformAdmin()
  if (!allowed && source?.city_id) {
    const { data } = await client.rpc('news_is_city_manager', { p_city_id: source.city_id })
    allowed = data === true
  }
  if (!allowed) return { ok: false, error: 'No autorizado.' }
  const { error } = await client.from('news_sources').update({ status: input.status, updated_at: new Date().toISOString() }).eq('id', input.sourceId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/noticias')
  revalidatePath('/noticias/crear')
  revalidatePath('/cities/[slug]/news/admin', 'page')
  return { ok: true }
}

export async function moderateNewsArticleAction(input: { articleId: string; action: 'feature' | 'unfeature' | 'remove' }): Promise<Result> {
  if (!(await isPlatformAdmin())) return { ok: false, error: 'No autorizado.' }
  const client = await getServerClient()
  const patch = input.action === 'remove' ? { status: 'removed', removed_at: new Date().toISOString() } : { is_featured: input.action === 'feature' }
  const { error } = await client.from('news_articles').update(patch).eq('id', input.articleId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/noticias')
  revalidatePath('/noticias')
  return { ok: true }
}

export async function requestNewsReplicaAction(input: { articleId: string; entityType: 'professional_profile' | 'page' | 'organization'; entityId: string }): Promise<Result> {
  const current = await session()
  if (!current) return { ok: false, error: 'Inicia sesión para solicitar una réplica.' }
  if (!input.articleId || !input.entityId) return { ok: false, error: 'Indica la noticia y la entidad legitimada.' }
  const { data: eligible } = await current.client.rpc('has_verified_professional_profile')
  if (eligible !== true) return { ok: false, error: 'Necesitas un perfil profesional verificado para solicitar una réplica.' }
  if (input.entityType === 'professional_profile') {
    const { data: entity } = await current.client.from('professional_profiles').select('id').eq('id', input.entityId).eq('user_id', current.userId).maybeSingle()
    if (!entity) return { ok: false, error: 'Ese perfil profesional no te pertenece o no está verificado.' }
  } else {
    const { data: entity } = await current.client.from('pages').select('id').eq('id', input.entityId).eq('owner_id', current.userId).eq('is_verified', true).maybeSingle()
    if (!entity) return { ok: false, error: 'La página debe pertenecerte y estar verificada por la plataforma.' }
  }
  const { error } = await current.client.from('news_replicas').insert({ article_id: input.articleId, entity_type: input.entityType, entity_id: input.entityId, requested_by: current.userId })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function createNewsSectionAction(input: { name: string; slug: string; description?: string }): Promise<Result> {
  if (!(await isPlatformAdmin())) return { ok: false, error: 'No autorizado.' }
  const name = input.name.trim(); const slug = slugify(input.slug)
  if (name.length < 2 || name.length > 80 || !slug) return { ok: false, error: 'La sección no es válida.' }
  const client = await getServerClient()
  const { error } = await client.from('news_sections').insert({ name, slug, description: input.description?.trim() || null, position: 100 })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/noticias'); revalidatePath('/admin/noticias'); return { ok: true }
}

export async function decideNewsReplicaAction(input: { replicaId: string; status: 'approved' | 'rejected' }): Promise<Result> {
  if (!(await isPlatformAdmin())) return { ok: false, error: 'No autorizado.' }
  const client = await getServerClient()
  const { data: replica } = await client.from('news_replicas').select('entity_type, entity_id').eq('id', input.replicaId).maybeSingle()
  if (!replica) return { ok: false, error: 'La solicitud de réplica ya no existe.' }
  if (input.status === 'approved') {
    const table = replica.entity_type === 'professional_profile' ? 'professional_profiles' : 'pages'
    let entityQuery = client.from(table).select('id').eq('id', replica.entity_id)
    if (table === 'pages') entityQuery = entityQuery.eq('is_verified', true)
    const { data: entity } = await entityQuery.maybeSingle()
    if (!entity) return { ok: false, error: 'La entidad ya no existe o perdió su verificación.' }
  }
  const { error } = await client.from('news_replicas').update({ status: input.status }).eq('id', input.replicaId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/noticias'); revalidatePath('/noticias'); return { ok: true }
}

export async function updateNewsModuleSettingsAction(input: Partial<{ newsEnabled: boolean; videosEnabled: boolean; weatherEnabled: boolean; trendsEnabled: boolean; adsEnabled: boolean }>): Promise<Result> {
  if (!(await isPlatformAdmin())) return { ok: false, error: 'No autorizado.' }
  const client = await getServerClient(); const patch: Record<string, boolean | string> = {}
  if (typeof input.newsEnabled === 'boolean') patch.news_enabled = input.newsEnabled
  if (typeof input.videosEnabled === 'boolean') patch.videos_enabled = input.videosEnabled
  if (typeof input.weatherEnabled === 'boolean') patch.weather_enabled = input.weatherEnabled
  if (typeof input.trendsEnabled === 'boolean') patch.trends_enabled = input.trendsEnabled
  if (typeof input.adsEnabled === 'boolean') patch.ads_enabled = input.adsEnabled
  patch.updated_at = new Date().toISOString()
  const { error } = await client.from('news_module_settings').update(patch).eq('singleton', true)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/noticias'); revalidatePath('/admin/noticias'); return { ok: true }
}

export async function createNewsAdAction(input: { slotId: string; advertiserName: string; headline: string; destinationUrl: string; imageCfImageId?: string | null; startsAt: string; endsAt: string }): Promise<Result> {
  if (!(await isPlatformAdmin())) return { ok: false, error: 'No autorizado.' }
  if (!input.slotId || !input.advertiserName.trim() || !input.headline.trim() || !input.destinationUrl.trim()) return { ok: false, error: 'Completa los datos de la pauta.' }
  if (input.imageCfImageId && !validCloudflareId(input.imageCfImageId)) return { ok: false, error: 'La imagen de la pauta debe ser de Cloudflare Images.' }
  const client = await getServerClient()
  const { error } = await client.from('news_ads').insert({ slot_id: input.slotId, advertiser_name: input.advertiserName.trim(), headline: input.headline.trim(), destination_url: input.destinationUrl.trim(), image_cf_image_id: validCloudflareId(input.imageCfImageId), starts_at: input.startsAt, ends_at: input.endsAt, status: 'active' })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/noticias'); revalidatePath('/admin/noticias'); return { ok: true }
}

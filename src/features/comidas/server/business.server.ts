import { cache } from 'react'
import * as Sentry from '@sentry/nextjs'
import { getServerClient } from '@/utils/supabase/server'
import type { Business, BusinessDetail, BusinessAdmin, BusinessFilters } from '../types'

export interface MyBusiness {
  business: Business
  is_primary: boolean
  can_edit_business: boolean
  can_manage_menu: boolean
  can_manage_media: boolean
  can_manage_posts: boolean
  can_manage_promotions: boolean
}

export const listBusinesses = cache(async (filters: BusinessFilters = {}) => {
  const client = await getServerClient()
  const { page = 1, limit = 24, category, city, search } = filters
  const { data: result, error } = await client.rpc('get_businesses', {
    p_category: category ?? null,
    p_city:     city     ?? null,
    p_search:   search   ?? null,
    p_page:     page,
    p_limit:    limit,
  })
  if (error) throw new Error(error.message)
  const r = (result ?? { data: [], count: 0 }) as { data: Business[]; count: number }
  return { data: r.data ?? [], count: r.count ?? 0 }
})

export const getBusinessBySlug = cache(async (slug: string): Promise<BusinessDetail | null> => {
  const client = await getServerClient()
  const { data: raw, error } = await client.rpc('get_business_by_slug', { p_slug: slug })
  if (error) throw new Error(error.message)
  // get_business_by_slug is declared RETURNS TABLE, so supabase-js gives back an array
  const base = Array.isArray(raw) ? (raw[0] ?? null) : raw
  if (!base) return null

  const bid = (base as { id: string }).id
  const [menus, media, reviews, promotions, faqs, posts] = await Promise.all([
    client.rpc('get_menus_by_business',      { p_business_id: bid }).then((r) => r.data ?? []),
    client.rpc('get_media_by_business',      { p_business_id: bid }).then((r) => r.data ?? []),
    client.rpc('get_reviews_by_business',    { p_business_id: bid }).then((r) => r.data ?? []),
    client.rpc('get_promotions_by_business', { p_business_id: bid }).then((r) => r.data ?? []),
    client.rpc('get_faqs_by_business',       { p_business_id: bid }).then((r) => r.data ?? []),
    Promise.resolve(client.rpc('get_posts_by_business', { p_business_id: bid })).then((r) => r.data ?? []).catch(() => []),
  ])

  return {
    ...(base as unknown as BusinessDetail),
    menus:        menus        as BusinessDetail['menus'],
    media_assets: media        as BusinessDetail['media_assets'],
    reviews:      reviews      as BusinessDetail['reviews'],
    promotions:   promotions   as BusinessDetail['promotions'],
    faqs:         faqs         as BusinessDetail['faqs'],
    posts:        posts        as BusinessDetail['posts'],
  }
})

export const getBusinessById = cache(async (id: string): Promise<Business | null> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_business_by_id', { p_id: id })
  if (error) throw new Error(error.message)
  return data as Business | null
})

export const getBusinessAdmins = cache(async (businessId: string): Promise<BusinessAdmin[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_business_admins', { p_business_id: businessId })
  if (error) throw new Error(error.message)
  return (data ?? []) as BusinessAdmin[]
})

// check_business_admin RPC (20260619000000_negocios_security_remediation.sql)
// derives the caller from auth.uid() internally — no user_id parameter,
// so a caller can never check admin status for an identity other than their own.
export async function isUserBusinessAdmin(businessId: string): Promise<boolean> {
  const client = await getServerClient()
  const { data, error } = await client.rpc('check_business_admin', {
    p_business_id: businessId,
  })
  if (error) {
    // Fail-closed by design (PRA-004): a transient RPC failure must never
    // grant access, so we deny here. But silently denying a legitimate
    // owner during an infra blip is its own incident — report it so SRE
    // sees a real alert instead of a confused "I lost access" support ticket.
    Sentry.captureException(error, {
      tags: { rpc: 'check_business_admin', businessId },
    })
    return false
  }
  return Boolean(data)
}

export const getMyAdminRecord = cache(
  async (businessId: string): Promise<BusinessAdmin | null> => {
    const client = await getServerClient()
    const { data } = await client.rpc('get_my_admin_record', {
      p_business_id: businessId,
    })
    return data as BusinessAdmin | null
  },
)

export const getMyBusinesses = cache(async (): Promise<MyBusiness[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_my_businesses')
  if (error) throw new Error(error.message)
  return (data ?? []).map((r: any) => ({
    business: r.business as Business,
    is_primary: r.is_primary,
    can_edit_business: r.can_edit_business,
    can_manage_menu: r.can_manage_menu,
    can_manage_media: r.can_manage_media,
    can_manage_posts: r.can_manage_posts,
    can_manage_promotions: r.can_manage_promotions,
  }))
})

export const getActivityLogs = cache(async (businessId: string) => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_activity_logs_by_business', { p_business_id: businessId })
  if (error) throw new Error(error.message)
  return (data ?? []) as Array<{ id: string; action: string; created_at: string; user_id: string; details?: Record<string, unknown> | null }>
})

import 'server-only'
import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getServerClient } from '@/utils/supabase/server'
import { cfImageUrl } from './cf'

export type ComplaintStatus = 'new' | 'seen' | 'resolved' | 'rejected'

export interface CityComplaint {
  id: string
  cityId: string
  title: string
  description: string | null
  category: string | null
  imageUrls: string[]
  status: ComplaintStatus
  reporterId: string | null
  createdAt: string
}

type Row = {
  id: string
  city_id: string
  title: string
  description: string | null
  category: string | null
  cf_image_ids: string[]
  status: ComplaintStatus
  reporter_id: string | null
  created_at: string
}

const SELECT = 'id, city_id, title, description, category, cf_image_ids, status, reporter_id, created_at'

function toDto(r: Row): CityComplaint {
  return {
    id: r.id,
    cityId: r.city_id,
    title: r.title,
    description: r.description,
    category: r.category,
    imageUrls: (r.cf_image_ids ?? [])
      .map((id) => cfImageUrl(id))
      .filter((url): url is string => Boolean(url)),
    status: r.status,
    reporterId: r.reporter_id,
    createdAt: r.created_at,
  }
}

/**
 * Public list — only `seen` and `resolved` complaints. Aligns with the RLS
 * policy `city_complaints_public_read_acknowledged` (see
 * `20260613120000_city_complaints_public_read.sql`): citizens see what the
 * administration has acknowledged or actioned, never raw new submissions.
 * `rejected` is admin-only and never surfaces here.
 *
 * NOTE: a reporter's own pending (`new`/`rejected`) rows ARE readable under
 * the `city_complaints_reporter_read_own` policy, but this public reader
 * filters them out. Surface them via a dedicated "my complaints" reader (à la
 * `contact.server.ts` `fetchMyMessagesForCity`) if/when that UI is built.
 */
export async function fetchVisibleComplaints(
  client: SupabaseClient,
  cityId: string,
  opts: { limit?: number } = {},
): Promise<CityComplaint[]> {
  const limit = opts.limit ?? 60
  const { data, error } = await client
    .from('city_complaints')
    .select(SELECT)
    .eq('city_id', cityId)
    .in('status', ['seen', 'resolved'])
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('[fetchVisibleComplaints]', error)
    return []
  }
  return ((data ?? []) as Row[]).map(toDto)
}

export const getVisibleComplaints = cache(async (cityId: string, opts: { limit?: number } = {}) => {
  const client = await getServerClient()
  return fetchVisibleComplaints(client, cityId, opts)
})

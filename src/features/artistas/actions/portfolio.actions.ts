'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { z } from 'zod'
import type { PortfolioItem } from '../types'

async function requireSession() {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) throw new Error('No autenticado')
  return { client }
}

const PortfolioItemSchema = z.object({
  artist_profile_id: z.string().min(1),
  title:             z.string().min(1).max(120),
  description:       z.string().optional(),
  media_type:        z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'LINK']),
  cf_image_id:       z.string().optional(),
  cf_video_uid:      z.string().optional(),
  cf_audio_key:      z.string().optional(),
  external_url:      z.string().optional(),
  year:              z.coerce.number().int().min(1900).max(2100).optional(),
  role:              z.string().max(80).optional(),
  is_featured:       z.coerce.boolean().optional(),
  tags:              z.string().optional(),
})

export async function createPortfolioItem(formData: FormData) {
  const { client } = await requireSession()
  const raw = Object.fromEntries(formData)
  const parsed = PortfolioItemSchema.safeParse(raw)
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const tags = typeof raw.tags === 'string' && raw.tags
    ? raw.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  const { data, error } = await client.rpc('artistas_create_portfolio_item', {
    p_data: { ...parsed.data, tags },
  })
  if (error) throw new Error(error.message)
  revalidatePath('/artistas/[slug]', 'page')
  return data as PortfolioItem
}

export async function updatePortfolioItem(itemId: string, formData: FormData) {
  const { client } = await requireSession()
  const raw = Object.fromEntries(formData)
  const parsed = PortfolioItemSchema.partial().safeParse(raw)
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const tags = typeof raw.tags === 'string' && raw.tags
    ? raw.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : undefined

  const { data, error } = await client.rpc('artistas_update_portfolio_item', {
    p_id:   itemId,
    p_data: { ...parsed.data, ...(tags !== undefined ? { tags } : {}) },
  })
  if (error) throw new Error(error.message)
  revalidatePath('/artistas/[slug]', 'page')
  return data as PortfolioItem
}

export async function reorderPortfolioItems(items: Array<{ id: string; sort_order: number }>) {
  const { client } = await requireSession()
  const { error } = await client.rpc('artistas_reorder_portfolio_items', { p_items: items })
  if (error) throw new Error(error.message)
  revalidatePath('/artistas/[slug]', 'page')
}

export async function deletePortfolioItem(itemId: string) {
  const { client } = await requireSession()
  const { error } = await client.rpc('artistas_delete_portfolio_item', { p_id: itemId })
  if (error) throw new Error(error.message)
  revalidatePath('/artistas/[slug]', 'page')
}

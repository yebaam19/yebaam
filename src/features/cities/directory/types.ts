import { PORTAL_SECTIONS } from '@/features/cities/data/portal-sections'

export const directorySections = PORTAL_SECTIONS.filter((section) =>
  section.hrefTemplate.startsWith('/cities/:slug/directory/'))
export const DIRECTORY_STATUSES = ['draft', 'published', 'archived'] as const
export type DirectoryStatus = typeof DIRECTORY_STATUSES[number]
export const isDirectoryCategory = (slug: string) => directorySections.some((s) => s.id === slug)
export const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

export interface DirectoryEntry {
  id: string
  city_id: string
  category_id: string
  name: string
  description: string
  address: string
  phone: string
  website: string
  cover_cf_image_id: string | null
  status: DirectoryStatus
}
export interface DirectoryInput extends Omit<DirectoryEntry, 'category_id'> {
  category: string
}

/** Validate untrusted action input before it reaches PostgREST or Cloudflare. */
export function validDirectoryInput(input: DirectoryInput): boolean {
  if (!input || !isUuid(input.id) || !isUuid(input.city_id) || !isDirectoryCategory(input.category)) return false
  if (!DIRECTORY_STATUSES.includes(input.status)) return false
  for (const [key, max] of Object.entries({ name: 150, description: 4000, address: 500, phone: 40, website: 2048 })) {
    const value = input[key as keyof DirectoryInput]
    if (typeof value !== 'string' || value.length > max) return false
  }
  if (!input.name.trim()) return false
  if (input.cover_cf_image_id !== null && (typeof input.cover_cf_image_id !== 'string' || !/^[A-Za-z0-9_-]{20,64}$/.test(input.cover_cf_image_id))) return false
  if (input.website) {
    try {
      const url = new URL(input.website)
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || /\s/.test(input.website)) return false
    } catch { return false }
  }
  return true
}

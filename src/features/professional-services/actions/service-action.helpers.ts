import type {
  CreateProfessionalServiceDTO,
  UpdateProfessionalServiceDTO,
} from '../interfaces/professional-service.interfaces'

export function slugify(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 100) || 'servicio'
  )
}

/** Pull the Cloudflare Images id out of a delivery URL (or pass through a bare id). */
export function extractCfImageId(value?: string | null): string | null {
  if (!value) return null
  if (!value.startsWith('http') && !value.includes('/')) return value
  const m = value.match(/imagedelivery\.net\/[^/]+\/([^/?#]+)/)
  return m ? m[1] : null
}

/** Pull the Cloudflare Stream uid out of any of its URL shapes (or pass through a bare uid). */
export function extractStreamUid(value?: string | null): string | null {
  if (!value) return null
  if (!value.startsWith('http') && !value.includes('/')) return value
  const m = value.match(/(?:iframe\.videodelivery\.net|videodelivery\.net|cloudflarestream\.com)\/([^/?#]+)/)
  return m ? m[1] : null
}

/**
 * Everything except `slug` — the slug is supplied per insert attempt so we can
 * recover from a unique-violation (RLS hides other users' non-public rows, so a
 * pre-check can't see every collision; also closes the check-then-insert race).
 */
export function buildServiceInsertPayload(
  userId: string,
  professionalProfileId: string | null | undefined,
  dto: CreateProfessionalServiceDTO,
): Record<string, unknown> {
  return {
    user_id: userId,
    professional_profile_id: professionalProfileId,
    name: dto.name.trim(),
    description: dto.description ?? null,
    category_id: dto.categoryId ?? null,
    city_id: dto.cityId ?? null,
    address: dto.address ?? null,
    email: dto.email ?? null,
    phone: dto.phone ?? null,
    website: dto.website ?? null,
    facebook_url: dto.facebookUrl ?? null,
    instagram_url: dto.instagramUrl ?? null,
    twitter_url: dto.twitterUrl ?? null,
    linkedin_url: dto.linkedinUrl ?? null,
    tiktok_url: dto.tiktokUrl ?? null,
    youtube_url: dto.youtubeUrl ?? null,
    hourly_rate: dto.hourlyRate ?? null,
    daily_rate: dto.dailyRate ?? null,
    project_rate: dto.projectRate ?? null,
    currency: dto.currency ?? 'COP',
    available_for_hire: dto.availableForHire ?? true,
    work_type: dto.workType ?? [],
    // Tags are lowercased so the case-insensitive tag search (cs operator) matches.
    tags: (dto.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean),
    visibility: dto.visibility ?? 'PUBLIC',
    status: 'ACTIVE',
  }
}

export function buildServiceUpdatePatch(dto: UpdateProfessionalServiceDTO): Record<string, unknown> {
  const update: Record<string, unknown> = {}
  const set = (key: string, value: unknown) => {
    if (value !== undefined) update[key] = value
  }
  set('name', dto.name)
  set('description', dto.description ?? null)
  set('category_id', dto.categoryId)
  set('city_id', dto.cityId)
  set('address', dto.address ?? null)
  set('email', dto.email ?? null)
  set('phone', dto.phone ?? null)
  set('website', dto.website ?? null)
  set('facebook_url', dto.facebookUrl ?? null)
  set('instagram_url', dto.instagramUrl ?? null)
  set('twitter_url', dto.twitterUrl ?? null)
  set('linkedin_url', dto.linkedinUrl ?? null)
  set('tiktok_url', dto.tiktokUrl ?? null)
  set('youtube_url', dto.youtubeUrl ?? null)
  set('hourly_rate', dto.hourlyRate ?? null)
  set('daily_rate', dto.dailyRate ?? null)
  set('project_rate', dto.projectRate ?? null)
  set('currency', dto.currency)
  set('available_for_hire', dto.availableForHire)
  set('work_type', dto.workType)
  set('visibility', dto.visibility)
  if (dto.tags !== undefined) update.tags = (dto.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean)
  if (dto.logoUrl !== undefined) update.logo_cf_image_id = extractCfImageId(dto.logoUrl)
  if (dto.coverUrl !== undefined) update.cover_cf_image_id = extractCfImageId(dto.coverUrl)
  if (dto.adImageUrl !== undefined) update.ad_cf_image_id = extractCfImageId(dto.adImageUrl)
  if (dto.cvUrl !== undefined) update.cv_cf_file_id = extractCfImageId(dto.cvUrl)
  return update
}

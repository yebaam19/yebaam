import 'server-only'

import { streamThumb } from '@/lib/media/urls'
import { findCategoryById } from '../data/service-categories-taxonomy'
import {
  ProfessionalService,
  ProfessionalServiceBasic,
  ProfessionalServiceMedia,
  ProfessionalServiceReview,
  ProfessionalServiceStatus,
  ProfessionalServiceSubcategory,
  ProfessionalServiceVisibility,
  ServiceCity,
  ServiceMediaType,
  ServiceOwner,
} from '../interfaces/professional-service.interfaces'
import {
  type CityEmbed,
  type MediaRow,
  type ProfileRow,
  type ReviewRow,
  type ServiceRow,
  type SubcategoryRow,
  cfImage,
  streamPlayback,
} from './_shared'

/**
 * DB row → domain mappers for professional services. Single source of truth for
 * the snake_case→camelCase shape + Cloudflare URL resolution, shared by the
 * detail and list read modules.
 */

export function mapOwner(p: ProfileRow | undefined): ServiceOwner | undefined {
  if (!p) return undefined
  return {
    id: p.id,
    username: p.username ?? '',
    firstName: p.first_name ?? '',
    lastName: p.last_name ?? '',
    avatarUrl: cfImage(p.avatar_cloudflare_id, 'avatar') ?? p.avatar_url ?? undefined,
    coverUrl: cfImage(p.cover_cloudflare_id, 'cover') ?? undefined,
    isVerified: Boolean(p.is_verified),
  }
}

export function mapCity(c: CityEmbed | null | undefined): ServiceCity {
  return {
    id: c?.id ?? '',
    name: c?.name ?? '',
    slug: c?.slug ?? '',
    state: c?.state ? { id: c.state.id, name: c.state.name } : undefined,
    country: { id: c?.country?.id ?? '', name: c?.country?.name ?? 'Colombia' },
  }
}

export function mapMedia(rows: MediaRow[]): ProfessionalServiceMedia[] {
  return rows
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((m) => {
      const isVideo = m.type === 'VIDEO'
      const url = isVideo
        ? (m.cf_stream_uid ? streamThumb(m.cf_stream_uid) : '')
        : (cfImage(m.cf_image_id) ?? '')
      return {
        id: m.id,
        serviceId: m.service_id,
        type: isVideo ? ServiceMediaType.VIDEO : ServiceMediaType.IMAGE,
        url,
        playbackUrl: isVideo && m.cf_stream_uid ? streamPlayback(m.cf_stream_uid) : undefined,
        caption: m.caption ?? undefined,
        order: m.position,
        createdAt: m.created_at,
      }
    })
}

export function mapSubcategories(rows: SubcategoryRow[]): ProfessionalServiceSubcategory[] {
  return rows.map((s) => ({
    id: s.subcategory_id,
    name: s.subcategory_name,
    slug: s.subcategory_id.split('__').pop() ?? s.subcategory_id,
    parentId: s.category_id ?? undefined,
  }))
}

export function mapReviews(
  rows: ReviewRow[],
  authors: Map<string, ProfileRow>,
): ProfessionalServiceReview[] {
  return rows.map((r) => {
    const a = authors.get(r.user_id)
    return {
      id: r.id,
      serviceId: r.service_id,
      userId: r.user_id,
      rating: r.rating,
      comment: r.comment ?? undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      user: {
        id: r.user_id,
        username: a?.username ?? '',
        firstName: a?.first_name ?? '',
        lastName: a?.last_name ?? '',
        avatarUrl: cfImage(a?.avatar_cloudflare_id, 'avatar') ?? a?.avatar_url ?? undefined,
      },
    }
  })
}

export function mapBasic(row: ServiceRow, owner: ProfileRow | undefined): ProfessionalServiceBasic {
  const category = row.category_id ? findCategoryById(row.category_id) : undefined
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    logoUrl: cfImage(row.logo_cf_image_id) ?? undefined,
    adImageUrl: cfImage(row.ad_cf_image_id) ?? cfImage(row.cover_cf_image_id, 'cover') ?? undefined,
    address: row.address ?? undefined,
    facebookUrl: row.facebook_url ?? undefined,
    instagramUrl: row.instagram_url ?? undefined,
    twitterUrl: row.twitter_url ?? undefined,
    linkedinUrl: row.linkedin_url ?? undefined,
    youtubeUrl: row.youtube_url ?? undefined,
    hourlyRate: row.hourly_rate ?? undefined,
    currency: row.currency,
    availableForHire: row.available_for_hire,
    category: category ? { id: category.id, name: category.name, iconUrl: category.iconUrl } : undefined,
    city: row.city ? { id: row.city.id, name: row.city.name, slug: row.city.slug } : undefined,
    user: owner
      ? {
          id: owner.id,
          username: owner.username ?? '',
          firstName: owner.first_name ?? '',
          lastName: owner.last_name ?? '',
          avatarUrl: cfImage(owner.avatar_cloudflare_id, 'avatar') ?? owner.avatar_url ?? undefined,
        }
      : undefined,
    _count: { reviews: row.review_count, media: row.media_count },
    averageRating: row.average_rating ?? 0,
  }
}

export function mapFull(
  row: ServiceRow,
  owner: ProfileRow | undefined,
  subcategories: SubcategoryRow[],
  media: MediaRow[],
  reviews: ReviewRow[],
  reviewAuthors: Map<string, ProfileRow>,
): ProfessionalService {
  const category = row.category_id ? findCategoryById(row.category_id) : undefined
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    logoUrl: cfImage(row.logo_cf_image_id) ?? undefined,
    coverUrl: cfImage(row.cover_cf_image_id, 'cover') ?? undefined,
    coverImage: cfImage(row.cover_cf_image_id, 'cover') ?? undefined,
    adImageUrl: cfImage(row.ad_cf_image_id) ?? undefined,
    businessCardUrl: cfImage(row.business_card_cf_image_id) ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    address: row.address ?? undefined,
    visibility: (row.visibility as ProfessionalServiceVisibility) ?? ProfessionalServiceVisibility.PUBLIC,
    status: (row.status as ProfessionalServiceStatus) ?? ProfessionalServiceStatus.ACTIVE,
    facebookUrl: row.facebook_url ?? undefined,
    instagramUrl: row.instagram_url ?? undefined,
    twitterUrl: row.twitter_url ?? undefined,
    linkedinUrl: row.linkedin_url ?? undefined,
    tiktokUrl: row.tiktok_url ?? undefined,
    youtubeUrl: row.youtube_url ?? undefined,
    hourlyRate: row.hourly_rate ?? undefined,
    dailyRate: row.daily_rate ?? undefined,
    projectRate: row.project_rate ?? undefined,
    currency: row.currency,
    availableForHire: row.available_for_hire,
    workType: row.work_type ?? undefined,
    cvUrl: cfImage(row.cv_cf_file_id) ?? undefined,
    userId: row.user_id,
    cityId: row.city_id ?? '',
    categoryId: row.category_id ?? undefined,
    tags: row.tags ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: mapOwner(owner),
    city: mapCity(row.city),
    category,
    subcategories: mapSubcategories(subcategories),
    media: mapMedia(media),
    reviews: mapReviews(reviews, reviewAuthors),
    _count: { media: row.media_count, reviews: row.review_count },
    averageRating: row.average_rating ?? 0,
  }
}

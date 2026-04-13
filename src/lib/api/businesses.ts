import 'server-only';

export type BusinessRow = {
  id: string;
  owner_id: string;
  category_id: string | null;
  city_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  ad_image_url: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  visibility: string;
  status: string;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  hours: Record<string, unknown> | null;
  tags: string[] | null;
  average_rating: string | number | null;
  created_at: string;
  updated_at: string;
};

export type BusinessCityRow = {
  id: string;
  state_id: string;
  name: string;
  slug: string;
};

export type StateRow = {
  id: string;
  name: string;
  slug: string;
  country_name: string;
};

export type BusinessCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  created_at: string;
};

export type BusinessMediaRow = {
  id: string;
  business_id: string;
  type: string;
  url: string;
  thumbnail_url: string | null;
  caption: string | null;
  alt: string | null;
  sort_order: number | null;
  created_at: string;
};

export type BusinessReviewRow = {
  id: string;
  business_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  response: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileLite = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || `business-${Date.now()}`
  );
}

type Refs = {
  categories: Map<string, BusinessCategoryRow>;
  cities: Map<string, BusinessCityRow>;
  states: Map<string, StateRow>;
  owners: Map<string, ProfileLite>;
  mediaCount: Map<string, number>;
  reviewsCount: Map<string, number>;
};

export function mapBusinessBasic(row: BusinessRow, refs: Refs) {
  const category = row.category_id ? refs.categories.get(row.category_id) : undefined;
  const city = row.city_id ? refs.cities.get(row.city_id) : undefined;
  const state = city ? refs.states.get(city.state_id) : undefined;
  const owner = refs.owners.get(row.owner_id);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    adImageUrl: row.ad_image_url ?? undefined,
    address: row.address ?? undefined,
    facebookUrl: row.facebook_url ?? undefined,
    instagramUrl: row.instagram_url ?? undefined,
    twitterUrl: row.twitter_url ?? undefined,
    linkedinUrl: row.linkedin_url ?? undefined,
    youtubeUrl: row.youtube_url ?? undefined,
    category: category
      ? { id: category.id, name: category.name, iconUrl: category.icon_url ?? undefined }
      : { id: row.category_id ?? '', name: 'Sin categoría' },
    city: city
      ? { id: city.id, name: city.name, slug: city.slug }
      : undefined,
    user: owner
      ? {
          id: owner.id,
          username: owner.username ?? '',
          firstName: owner.first_name ?? '',
          lastName: owner.last_name ?? '',
          avatarUrl: owner.avatar_url ?? undefined,
        }
      : undefined,
    _count: {
      reviews: refs.reviewsCount.get(row.id) ?? 0,
      media: refs.mediaCount.get(row.id) ?? 0,
    },
    averageRating: row.average_rating !== null ? Number(row.average_rating) : undefined,
    stateId: state?.id,
  };
}

export function mapBusinessDetail(
  row: BusinessRow,
  refs: Refs,
  media: BusinessMediaRow[],
  reviews: Array<BusinessReviewRow & { author?: ProfileLite }>
) {
  const basic = mapBusinessBasic(row, refs);
  const category = row.category_id ? refs.categories.get(row.category_id) : undefined;
  const city = row.city_id ? refs.cities.get(row.city_id) : undefined;
  const state = city ? refs.states.get(city.state_id) : undefined;
  const owner = refs.owners.get(row.owner_id);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    coverUrl: row.cover_url ?? undefined,
    adImageUrl: row.ad_image_url ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    address: row.address ?? undefined,
    visibility: row.visibility,
    status: row.status,
    facebookUrl: row.facebook_url ?? undefined,
    instagramUrl: row.instagram_url ?? undefined,
    twitterUrl: row.twitter_url ?? undefined,
    linkedinUrl: row.linkedin_url ?? undefined,
    tiktokUrl: row.tiktok_url ?? undefined,
    youtubeUrl: row.youtube_url ?? undefined,
    hours: (row.hours ?? {}) as Record<string, string>,
    userId: row.owner_id,
    cityId: row.city_id ?? '',
    categoryId: row.category_id ?? '',
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: owner
      ? {
          id: owner.id,
          username: owner.username ?? '',
          firstName: owner.first_name ?? '',
          lastName: owner.last_name ?? '',
          avatarUrl: owner.avatar_url ?? undefined,
        }
      : {
          id: row.owner_id,
          username: '',
          firstName: '',
          lastName: '',
        },
    city: city
      ? {
          id: city.id,
          name: city.name,
          slug: city.slug,
          state: state ? { id: state.id, name: state.name } : undefined,
          country: { id: state?.country_name ?? 'CO', name: state?.country_name ?? 'Colombia' },
        }
      : {
          id: '',
          name: '',
          slug: '',
          country: { id: 'CO', name: 'Colombia' },
        },
    category: category
      ? {
          id: category.id,
          name: category.name,
          description: category.description ?? undefined,
          iconUrl: category.icon_url ?? undefined,
          createdAt: category.created_at,
        }
      : {
          id: row.category_id ?? '',
          name: 'Sin categoría',
          createdAt: row.created_at,
        },
    media: media.map((m) => ({
      id: m.id,
      businessId: m.business_id,
      type: m.type,
      url: m.url,
      thumbnailUrl: m.thumbnail_url ?? undefined,
      caption: m.caption ?? undefined,
      alt: m.alt ?? undefined,
      order: m.sort_order ?? 0,
      createdAt: m.created_at,
    })),
    reviews: reviews.map((r) => ({
      id: r.id,
      businessId: r.business_id,
      userId: r.user_id,
      rating: r.rating,
      title: r.title ?? undefined,
      content: r.comment ?? undefined,
      comment: r.comment ?? undefined,
      response: r.response ?? undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      user: {
        id: r.user_id,
        username: r.author?.username ?? '',
        firstName: r.author?.first_name ?? '',
        lastName: r.author?.last_name ?? '',
        avatarUrl: r.author?.avatar_url ?? undefined,
      },
    })),
    _count: basic._count,
    averageRating: basic.averageRating,
  };
}

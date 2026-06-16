// =====================================================================
// Artistas — Tipos TypeScript
// Espejo exacto del schema SQL artistas.*
// Media: cf_image_id / cf_video_uid / cf_audio_key (Cloudflare)
// =====================================================================

export type ArtistType =
  | 'MUSICIAN' | 'SINGER' | 'DANCER' | 'ACTOR' | 'MODEL'
  | 'VISUAL_ARTIST' | 'PHOTOGRAPHER' | 'FILMMAKER' | 'WRITER'
  | 'PRODUCER' | 'DJ' | 'COMEDIAN' | 'PERFORMER' | 'MAKEUP_ARTIST'
  | 'FASHION_DESIGNER' | 'MULTIDISCIPLINARY' | 'OTHER'

export type DisciplineType =
  | 'MUSIC' | 'DANCE' | 'THEATER' | 'VISUAL_ARTS' | 'AUDIOVISUAL'
  | 'PHOTOGRAPHY' | 'FASHION' | 'LITERATURE' | 'CIRCUS' | 'PERFORMANCE'
  | 'COMEDY' | 'MODELING' | 'PRODUCTION' | 'MULTIDISCIPLINARY' | 'OTHER'

export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'LINK'
export type RequestStatus = 'PENDING' | 'CONTACTED' | 'APPROVED' | 'REJECTED' | 'ARCHIVED'
export type PublicationStatus = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED'
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'FINISHED' | 'ARCHIVED'
export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'FINISHED' | 'ARCHIVED'
export type OpportunityStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED' | 'ARCHIVED'
export type OpportunityType =
  | 'CASTING' | 'AUDITION' | 'COLLABORATION' | 'JOB' | 'FESTIVAL'
  | 'EXHIBITION' | 'CONTEST' | 'CULTURAL_CALL' | 'BRAND_CAMPAIGN' | 'OTHER'
export type ApplicationStatus = 'PENDING' | 'REVIEWED' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED' | 'ARCHIVED'
export type ProfileStatus = 'DRAFT' | 'PUBLISHED' | 'SUSPENDED' | 'ARCHIVED'
export type ServiceType =
  | 'LIVE_PERFORMANCE' | 'PRIVATE_EVENT' | 'BRAND_COLLABORATION' | 'TEACHING'
  | 'PRODUCTION' | 'CONSULTING' | 'COMMISSION_WORK' | 'SESSION_WORK'
  | 'CONTENT_CREATION' | 'OTHER'
export type LocationMode = 'IN_PERSON' | 'ONLINE' | 'HYBRID' | 'TO_BE_DEFINED'
export type EventKind = 'ARTIST_EVENT' | 'PLATFORM_EVENT'
export type CampaignType =
  | 'PROMOTION' | 'AUDITION' | 'RELEASE' | 'PORTFOLIO_LAUNCH'
  | 'CULTURAL_CALL' | 'FEATURED_ARTIST' | 'BRAND_COLLABORATION'
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED'

// ---------------------
// artist_categories
// ---------------------
export interface ArtistCategory {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  is_active: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

// ---------------------
// artistic_disciplines
// ---------------------
export interface ArtisticDiscipline {
  id: string
  name: string
  slug: string
  type: DisciplineType
  description: string | null
  is_active: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

// ---------------------
// artist_profiles
// ---------------------
export interface ArtistProfile {
  id: string
  owner_id: string
  category_id: string | null
  slug: string
  stage_name: string
  legal_name: string | null
  artist_type: ArtistType
  status: ProfileStatus
  biography: string | null
  short_bio: string | null
  city: string
  country: string
  availability: string | null
  website: string | null
  profile_cf_image_id: string | null
  cover_cf_image_id: string | null
  is_verified: boolean
  is_featured: boolean
  profile_views: number
  follower_count: number
  favorite_count: number
  portfolio_count: number
  seo_title: string | null
  seo_description: string | null
  metadata: Record<string, unknown> | null
  published_at: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface ArtistProfileDetail extends ArtistProfile {
  category?: ArtistCategory | null
  disciplines?: ArtisticDiscipline[]
  portfolio_items?: PortfolioItem[]
  service_offers?: ServiceOffer[]
  experiences?: Experience[]
  achievements?: Achievement[]
  educations?: Education[]
  social_links?: SocialLink[]
  reviews?: Review[]
  is_following?: boolean
  is_favorited?: boolean
}

// ---------------------
// portfolio_items
// ---------------------
export interface PortfolioItem {
  id: string
  artist_profile_id: string
  title: string
  slug: string | null
  description: string | null
  media_type: MediaType
  cf_image_id: string | null
  cf_video_uid: string | null
  cf_audio_key: string | null
  external_url: string | null
  year: number | null
  role: string | null
  credits: string | null
  location: string | null
  is_featured: boolean
  sort_order: number
  tags: string[]
  status: PublicationStatus
  views: number
  metadata: Record<string, unknown> | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

// ---------------------
// media_assets
// ---------------------
export interface MediaAsset {
  id: string
  uploader_id: string | null
  artist_profile_id: string | null
  portfolio_item_id: string | null
  cf_image_id: string | null
  cf_video_uid: string | null
  cf_audio_key: string | null
  resource_type: MediaType
  format: string | null
  bytes: number | null
  width: number | null
  height: number | null
  duration: number | null
  alt_text: string | null
  metadata: Record<string, unknown> | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

// ---------------------
// service_offers
// ---------------------
export interface ServiceOffer {
  id: string
  artist_profile_id: string
  title: string
  description: string | null
  service_type: ServiceType
  price_from: number | null
  currency: string
  duration: string | null
  location_mode: LocationMode
  is_active: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

// ---------------------
// experiences / achievements / educations / social_links
// ---------------------
export interface Experience {
  id: string
  artist_profile_id: string
  title: string
  organization: string | null
  role: string | null
  location: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean
  description: string | null
  sort_order: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: string
  artist_profile_id: string
  title: string
  issuer: string | null
  achieved_at: string | null
  description: string | null
  url: string | null
  sort_order: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface Education {
  id: string
  artist_profile_id: string
  title: string
  institution: string | null
  field: string | null
  start_year: number | null
  end_year: number | null
  description: string | null
  sort_order: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface SocialLink {
  id: string
  artist_profile_id: string
  platform: string
  label: string | null
  url: string
  sort_order: number
  is_public: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

// ---------------------
// manager_artists
// ---------------------
export interface ManagerArtist {
  id: string
  manager_id: string
  artist_profile_id: string
  assigned_at: string
  deleted_at: string | null
  created_at: string
  updated_at: string
}

// ---------------------
// requests (contact / booking / collaboration)
// ---------------------
export interface ContactRequest {
  id: string
  artist_profile_id: string
  requester_id: string | null
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  status: RequestStatus
  metadata: Record<string, unknown> | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface BookingRequest {
  id: string
  artist_profile_id: string
  requester_id: string | null
  name: string
  email: string
  phone: string | null
  event_type: string | null
  event_date: string | null
  location: string | null
  budget: number | null
  currency: string
  message: string
  status: RequestStatus
  metadata: Record<string, unknown> | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface CollaborationRequest {
  id: string
  artist_profile_id: string
  requester_id: string | null
  name: string
  email: string
  phone: string | null
  collaboration_type: string | null
  proposal: string
  message: string | null
  status: RequestStatus
  metadata: Record<string, unknown> | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

// ---------------------
// opportunities
// ---------------------
export interface Opportunity {
  id: string
  author_id: string | null
  slug: string
  title: string
  description: string
  type: OpportunityType
  status: OpportunityStatus
  city: string | null
  country: string | null
  modality: LocationMode
  deadline: string | null
  cover_cf_image_id: string | null
  requirements: string[]
  is_featured: boolean
  views: number
  seo_title: string | null
  seo_description: string | null
  metadata: Record<string, unknown> | null
  published_at: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface OpportunityApplication {
  id: string
  opportunity_id: string
  artist_profile_id: string
  applicant_id: string | null
  cover_letter: string | null
  attachments: string[]
  status: ApplicationStatus
  metadata: Record<string, unknown> | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

// ---------------------
// campaigns / events / articles
// ---------------------
export interface ArtistCampaign {
  id: string
  artist_profile_id: string | null
  owner_id: string | null
  slug: string
  title: string
  description: string
  type: CampaignType
  status: CampaignStatus
  starts_at: string | null
  ends_at: string | null
  goal: string | null
  cover_cf_image_id: string | null
  cta_url: string | null
  is_featured: boolean
  views: number
  seo_title: string | null
  seo_description: string | null
  metadata: Record<string, unknown> | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface ArtistEvent {
  id: string
  artist_profile_id: string | null
  owner_id: string | null
  slug: string
  title: string
  description: string
  type: EventKind
  status: EventStatus
  starts_at: string
  ends_at: string | null
  venue_name: string | null
  city: string | null
  country: string | null
  address: string | null
  is_online: boolean
  ticket_url: string | null
  cover_cf_image_id: string | null
  is_featured: boolean
  views: number
  seo_title: string | null
  seo_description: string | null
  metadata: Record<string, unknown> | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface ArtistArticle {
  id: string
  author_id: string | null
  slug: string
  title: string
  excerpt: string | null
  content: string
  cover_cf_image_id: string | null
  tags: string[]
  status: PublicationStatus
  is_featured: boolean
  seo_title: string | null
  seo_description: string | null
  published_at: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

// ---------------------
// reviews / follows / favorites
// ---------------------
export interface Review {
  id: string
  artist_profile_id: string
  reviewer_id: string
  rating: number
  title: string | null
  comment: string
  is_published: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  profile?: { username: string; avatar_url: string | null } | null
}

export interface Follow {
  id: string
  follower_id: string
  artist_profile_id: string
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface Favorite {
  id: string
  user_id: string
  artist_profile_id: string
  deleted_at: string | null
  created_at: string
  updated_at: string
}

// ---------------------
// Form inputs
// ---------------------
export interface CreateArtistProfileInput {
  slug: string
  stage_name: string
  legal_name?: string
  artist_type: ArtistType
  biography?: string
  short_bio?: string
  city: string
  country?: string
  availability?: string
  website?: string
  profile_cf_image_id?: string
  cover_cf_image_id?: string
  category_id?: string
  seo_title?: string
  seo_description?: string
}

export interface CreatePortfolioItemInput {
  artist_profile_id: string
  title: string
  description?: string
  media_type: MediaType
  cf_image_id?: string
  cf_video_uid?: string
  cf_audio_key?: string
  external_url?: string
  year?: number
  role?: string
  is_featured?: boolean
  tags?: string[]
}

export interface CreateOpportunityInput {
  slug: string
  title: string
  description: string
  type: OpportunityType
  city?: string
  modality?: LocationMode
  deadline?: string
  cover_cf_image_id?: string
  requirements?: string[]
}

export interface SendContactRequestInput {
  artist_profile_id: string
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
}

export interface SendBookingRequestInput {
  artist_profile_id: string
  name: string
  email: string
  phone?: string
  event_type?: string
  event_date?: string
  location?: string
  budget?: number
  currency?: string
  message: string
}

export interface ArtistFilters {
  category_id?: string
  artist_type?: ArtistType
  city?: string
  search?: string
  page?: number
  limit?: number
}

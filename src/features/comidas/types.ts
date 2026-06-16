// =====================================================================
// Comidas — Tipos TypeScript
// Espejo exacto del schema SQL comidas.*
// Media: cf_image_id / cf_video_uid (Cloudflare) — nunca URL completa
// =====================================================================

export type MediaType = 'IMAGE' | 'VIDEO' | 'REEL'
export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type PromotionStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'ARCHIVED'
export type InteractionEventType =
  | 'REGISTER_SUCCESS'
  | 'LOGIN_SUCCESS'
  | 'BUSINESS_PROFILE_VIEW'
  | 'MENU_VIEW'
  | 'PRODUCT_VIEW'
  | 'GALLERY_OPEN'
  | 'VIDEO_PLAY'
  | 'REVIEW_SUBMIT'
  | 'PROMOTION_CLICK'
  | 'CTA_CLICK'
  | 'FOLLOW_BUSINESS'

// ---------------------
// business_admins
// ---------------------
export interface BusinessAdmin {
  id: string
  user_id: string
  business_id: string
  display_name: string | null
  title: string | null
  is_primary: boolean
  is_visible_on_profile: boolean
  can_edit_business: boolean
  can_manage_menu: boolean
  can_manage_media: boolean
  can_manage_posts: boolean
  can_manage_promotions: boolean
  created_at: string
  updated_at: string
}

// ---------------------
// businesses
// ---------------------
export interface Business {
  id: string
  created_by: string | null
  name: string
  slug: string
  category: string
  business_type: string | null
  description: string | null
  about_article: string | null
  profile_cf_image_id: string | null
  is_verified: boolean
  city: string | null
  address: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  tiktok: string | null
  founded_at: string | null
  capacity: number | null
  is_active: boolean
  review_count: number
  avg_rating: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/** Vista enriquecida usada en páginas de detalle */
export interface BusinessDetail extends Business {
  menus?: MenuWithCategories[]
  media_assets?: MediaAsset[]
  reviews?: Review[]
  promotions?: Promotion[]
  faqs?: FAQ[]
  admins?: BusinessAdmin[]
  posts?: Post[]
  is_liked?: boolean
  is_followed?: boolean
  is_customer?: boolean
}

/** Usuario de la comunidad (clientes / seguidores) */
export interface CommunityUserPreview {
  id: string
  name: string
  username?: string | null
  avatar_url?: string | null
}

// ---------------------
// menus / menu_categories
// ---------------------
export interface Menu {
  id: string
  business_id: string
  name: string
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface MenuCategory {
  id: string
  menu_id: string
  name: string
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface MenuWithCategories extends Menu {
  categories: MenuCategoryWithProducts[]
}

export interface MenuCategoryWithProducts extends MenuCategory {
  products: Product[]
}

// ---------------------
// products
// ---------------------
export interface Product {
  id: string
  category_id: string
  business_id: string
  name: string
  slug: string
  short_description: string | null
  description: string | null
  ingredients: string | null
  price: number
  currency: string
  cf_image_id: string | null
  is_featured: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// ---------------------
// media_assets
// ---------------------
export interface MediaAsset {
  id: string
  business_id: string
  product_id: string | null
  type: MediaType
  cf_image_id: string | null
  cf_video_uid: string | null
  alt_text: string | null
  title: string | null
  caption: string | null
  width: number | null
  height: number | null
  duration_seconds: number | null
  is_primary: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// ---------------------
// reviews
// ---------------------
export interface Review {
  id: string
  business_id: string
  user_id: string
  rating: number
  comment: string | null
  is_visible: boolean
  created_at: string
  updated_at: string
  /** Datos del perfil del usuario — join opcional */
  profile?: { username: string; avatar_url: string | null } | null
}

// ---------------------
// promotions
// ---------------------
export interface Promotion {
  id: string
  business_id: string
  title: string
  slug: string
  description: string | null
  cf_image_id: string | null
  cta_label: string | null
  cta_url: string | null
  starts_at: string | null
  ends_at: string | null
  status: PromotionStatus
  is_highlighted: boolean
  created_at: string
  updated_at: string
}

// ---------------------
// posts
// ---------------------
export interface Post {
  id: string
  business_id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_cf_image_id: string | null
  status: PostStatus
  published_at: string | null
  created_at: string
  updated_at: string
}

// ---------------------
// faqs
// ---------------------
export interface FAQ {
  id: string
  business_id: string
  question: string
  answer: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// ---------------------
// follow / like / customer
// ---------------------
export interface FollowRelation {
  id: string
  user_id: string
  business_id: string
  created_at: string
}

export interface BusinessLike {
  id: string
  user_id: string
  business_id: string
  created_at: string
}

export interface BusinessCustomer {
  id: string
  user_id: string
  business_id: string
  created_at: string
}

// ---------------------
// Forms (inputs para acciones)
// ---------------------
export interface CreateBusinessInput {
  name: string
  slug: string
  category: string
  business_type?: string
  description?: string
  about_article?: string
  profile_cf_image_id?: string
  city?: string
  address?: string
  phone?: string
  whatsapp?: string
  email?: string
  website?: string
  instagram?: string
  facebook?: string
  tiktok?: string
  founded_at?: string
  capacity?: number
}

export interface UpdateBusinessInput extends Partial<CreateBusinessInput> {
  is_active?: boolean
  is_verified?: boolean
}

export interface CreateProductInput {
  category_id: string
  business_id: string
  name: string
  slug: string
  short_description?: string
  description?: string
  ingredients?: string
  price: number
  currency?: string
  cf_image_id?: string
}

export interface CreateReviewInput {
  business_id: string
  rating: number
  comment?: string
}

export interface CreatePromotionInput {
  business_id: string
  title: string
  slug: string
  description?: string
  cf_image_id?: string
  cta_label?: string
  cta_url?: string
  starts_at?: string
  ends_at?: string
  status?: PromotionStatus
  is_highlighted?: boolean
}

export interface CreateBusinessAdminInput {
  user_id: string
  business_id: string
  display_name?: string
  title?: string
  is_primary?: boolean
  can_edit_business?: boolean
  can_manage_menu?: boolean
  can_manage_media?: boolean
  can_manage_posts?: boolean
  can_manage_promotions?: boolean
}

// Parámetros de búsqueda/filtro
export interface BusinessFilters {
  category?: string
  city?: string
  search?: string
  page?: number
  limit?: number
}

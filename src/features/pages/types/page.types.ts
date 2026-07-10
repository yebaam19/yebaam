export type PageCategory = 
  | 'LOCAL_BUSINESS'
  | 'COMPANY'
  | 'BRAND'
  | 'ARTIST'
  | 'PUBLIC_FIGURE'
  | 'ENTERTAINMENT'
  | 'CAUSE'
  | 'COMMUNITY'
  | 'SPORTS'
  | 'EDUCATION'
  | 'NONPROFIT'
  | 'RELIGION'
  | 'HEALTH'
  | 'OTHER';

export type PageRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'MODERATOR';

export type PagePrivacy = 'PUBLIC' | 'PRIVATE';

/**
 * Enlaces a redes sociales de la Página (§3 Información del Perfil, §7 Contacto).
 * `whatsapp` guarda el número en formato internacional (solo dígitos) para
 * construir un deep-link wa.me al renderizar — nunca la URL completa.
 */
export interface PageSocialLinks {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  x?: string;
  spotify?: string;
  whatsapp?: string;
}

export interface PageContact {
  email?: string;
  phone?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  social?: PageSocialLinks;
}

export interface PageStats {
  followersCount: number;
  postsCount: number;
  engagementRate: number;
  reachLast30Days: number;
}

export interface PageMember {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  bio?: string;
  role: PageRole;
  joinedAt: string;
}

export interface Page {
  id: string;
  name: string;
  slug: string; // Backend usa 'slug', no 'username'
  url?: string; // URL completa
  description: string;
  category: string; // Backend retorna strings como 'Company & Organization'
  subcategory?: string;
  
  // Images - Backend usa estos nombres
  profileImageUrl?: string;
  coverImageUrl?: string;
  
  // Contact info
  contact?: PageContact;
  
  // Social - Backend usa 'followerCount' (singular)
  followerCount: number;
  isFollowing?: boolean;
  isVerified: boolean;

  /** PDF §1.3 — denormalized counters + viewer flags from page_reactions */
  recommendCount?: number;
  likeCount?: number;
  hasRecommended?: boolean;
  hasLiked?: boolean;

  /** PDF §5 — contenido destacado */
  featuredType?: 'reel' | 'video' | 'image' | null;
  featuredPostId?: string | null;
  featuredCfImageId?: string | null;
  featuredAutoplay?: boolean;

  /**
   * PDF §7 — vínculo a la sala de Chat Público / espacio de Foro propios de la
   * página. Las rutas de ambos módulos son por slug, así que el backend expone
   * id + slug; slug null ⇒ sala/espacio inexistente o archivado (enlace genérico).
   */
  chatPublicoRoomId?: string | null;
  chatPublicoRoomSlug?: string | null;
  foroSpaceId?: string | null;
  foroSpaceSlug?: string | null;
  
  // Ownership
  ownerId: string;
  ownerName?: string;
  ownerUsername?: string;
  ownerAvatar?: string;
  ownerBio?: string;
  
  // User's role in page - Backend usa lowercase 'owner', 'admin', etc
  userRole?: string;
  teamMembers?: Array<{
    userId: string;
    role: string;
    assignedAt: string;
  }>;
  
  // Stats
  postCount: number; // Backend usa 'postCount' (singular)
  verificationRequestedAt?: string;
  
  // Meta
  privacy: string; // Backend usa lowercase 'public', 'restricted'
  createdAt: string;
  updatedAt: string;
}

export type PageReactionType = 'recommend' | 'like';

export interface PageReactionResult {
  success: boolean;
  type: PageReactionType;
  active: boolean;
  recommendCount: number;
  likeCount: number;
}

export interface CreatePageDto {
  name: string;
  slug?: string; // Opcional, se puede generar del nombre
  description: string;
  category: string; // Backend usa strings como 'Local Business'
  subcategory?: string;
  profileImageUrl?: string; // Backend usa profileImageUrl
  coverImageUrl?: string;
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
    };
  };
  privacy?: string; // 'public' | 'restricted'
}

export interface UpdatePageDto {
  name?: string;
  username?: string;
  description?: string;
  category?: PageCategory;
  subcategory?: string;
  // id-first: se envía el id de Cloudflare Images desnudo (null para quitar).
  // El route handler PUT /api/pages/[idOrSlug] lee exactamente estas claves.
  profileImageUrl?: string | null;
  coverImageUrl?: string | null;
  contact?: PageContact;
  privacy?: PagePrivacy;
  /** PDF §5 — null clears featured content */
  featuredType?: 'reel' | 'video' | 'image' | null;
  featuredPostId?: string | null;
  featuredCfImageId?: string | null;
  featuredAutoplay?: boolean;
}

export interface SearchPagesParams {
  query?: string;
  category?: PageCategory;
  verified?: boolean;
  location?: string;
  limit?: number;
}

export interface PageFollower {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  followedAt: string;
}

export interface AssignRoleDto {
  userId: string;
  role: PageRole;
}

// API Response types
export interface PagesListResponse {
  pages: Page[];
  total: number;
  hasMore: boolean;
}

export interface PageResponse {
  page: Page;
  userRole?: PageRole;
  isFollowing: boolean;
}

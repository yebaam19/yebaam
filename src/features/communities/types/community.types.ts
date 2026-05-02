/**
 * Types and interfaces for Communities feature
 */

// Community Categories
export enum CommunityCategory {
  TECNOLOGIA = 'TECNOLOGIA',
  GAMING = 'GAMING',
  DEPORTES = 'DEPORTES',
  MUSICA = 'MUSICA',
  ARTE = 'ARTE',
  CIENCIA = 'CIENCIA',
  EDUCACION = 'EDUCACION',
  NEGOCIOS = 'NEGOCIOS',
  SALUD = 'SALUD',
  LIFESTYLE = 'LIFESTYLE',
  VIAJES = 'VIAJES',
  COMIDA = 'COMIDA',
  MODA = 'MODA',
  FOTOGRAFIA = 'FOTOGRAFIA',
  CINE = 'CINE',
  LIBROS = 'LIBROS',
  POLITICA = 'POLITICA',
  MEDIO_AMBIENTE = 'MEDIO_AMBIENTE',
  ANIMALES = 'ANIMALES',
  OTROS = 'OTROS',
}

// Community Privacy Types
export enum CommunityPrivacy {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  SECRET = 'SECRET',
}

// Community Member Role
export enum CommunityRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER',
}

// Community Member Interface
export interface CommunityMember {
  id: string;
  userId: string;
  username: string;
  name: string;
  avatar?: string;
  role: CommunityRole;
  joinedAt: string;
  isVerified?: boolean;
}

// Community Post Media Item — union of image and video flavours.
// Images carry a resolved Cloudflare delivery URL.
// Videos carry the Cloudflare Stream `uid` and an optional poster URL.
export interface CommunityPostMediaItem {
  kind: 'image' | 'video';
  url?: string;
  cfVideoUid?: string;
  thumbnail?: string;
}

/**
 * Reference to a community article rendered as a preview card inside a feed
 * post. Populated when an author shared one of their own articles via
 * `shareCommunityArticleToFeed`.
 */
export interface CommunityPostArticleRef {
  slug: string;
  title: string;
  href: string;
}

// Community Post Interface
export interface CommunityPost {
  id: string;
  communityId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  /** Resolved Cloudflare image URLs — kept for backwards compatibility with existing consumers. */
  images?: string[];
  /** Structured media items — preferred for rendering on the detail page (images + videos). */
  media?: CommunityPostMediaItem[];
  /** Set when the post is a share of a community article. */
  articleRef?: CommunityPostArticleRef;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
  isPinned?: boolean;
}

// Community Rules Interface
export interface CommunityRule {
  id: string;
  title: string;
  description: string;
  order: number;
}

// Community Stats Interface
export interface CommunityStats {
  membersCount: number;
  postsCount: number;
  activeMembers: number;
  growthRate: number; // Percentage
  postsPerDay: number;
}

// Main Community Interface
export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: CommunityCategory;
  privacy: CommunityPrivacy;
  coverImageUrl?: string;
  profileImageUrl?: string;
  stats: CommunityStats;
  owner: CommunityMember;
  rules?: CommunityRule[];
  tags?: string[];
  location?: string;
  website?: string;
  createdAt: string;
  isMember: boolean;
  isVerified?: boolean;
  allowMemberPosts: boolean;
  requireApproval: boolean;
}

// Create Community DTO
export interface CreateCommunityDto {
  name: string;
  description: string;
  category: CommunityCategory;
  privacy: CommunityPrivacy;
  coverImageUrl?: string;
  profileImageUrl?: string;
  tags?: string[];
  location?: string;
  website?: string;
  rules?: Omit<CommunityRule, 'id'>[];
  allowMemberPosts?: boolean;
  requireApproval?: boolean;
}

// Update Community DTO
export interface UpdateCommunityDto extends Partial<CreateCommunityDto> {
  id: string;
}

// Search/Filter Communities Parameters
export interface SearchCommunitiesParams {
  query?: string;
  category?: CommunityCategory;
  privacy?: CommunityPrivacy;
  minMembers?: number;
  maxMembers?: number;
  tags?: string[];
  location?: string;
  verified?: boolean;
  sortBy?: 'members' | 'activity' | 'growth' | 'recent';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// API Response Types
export interface CommunityResponse {
  success: boolean;
  data: Community;
  message?: string;
}

export interface CommunitiesListResponse {
  success: boolean;
  data: Community[];
  total: number;
  page: number;
  limit: number;
  message?: string;
}

export interface CommunityPostsResponse {
  success: boolean;
  data: CommunityPost[];
  total: number;
  page: number;
  limit: number;
}

export interface CommunityMembersResponse {
  success: boolean;
  data: CommunityMember[];
  total: number;
  page: number;
  limit: number;
}

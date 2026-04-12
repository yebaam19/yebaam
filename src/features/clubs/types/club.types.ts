export type ClubCategory = 
  | 'DEPORTES'
  | 'CULTURAL'
  | 'PROFESIONAL'
  | 'EDUCATIVO'
  | 'SOCIAL'
  | 'GAMING'
  | 'TECNOLOGIA'
  | 'ARTE'
  | 'MUSICA'
  | 'LIBRO'
  | 'CINE'
  | 'GASTRONOMIA'
  | 'VIAJES'
  | 'BIENESTAR'
  | 'NEGOCIOS'
  | 'OTRO';

export type ClubPrivacy = 'PUBLIC' | 'PRIVATE';

export type MembershipTier = 'FREE' | 'BASIC' | 'PREMIUM' | 'VIP';

export type ClubRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';

export interface ClubMember {
  id: string;
  userId: string;
  username: string;
  name: string;
  avatar?: string;
  role: ClubRole;
  membershipTier: MembershipTier;
  joinedAt: Date;
  isVerified?: boolean;
}

export interface ClubEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  location?: string;
  isOnline: boolean;
  attendeesCount: number;
  maxAttendees?: number;
  coverImage?: string;
  isAttending?: boolean;
}

export interface ClubBenefit {
  id: string;
  title: string;
  description: string;
  tier: MembershipTier;
  icon?: string;
}

export interface ClubStats {
  membersCount: number;
  eventsCount: number;
  postsCount: number;
  activeMembers: number; // Miembros activos en los últimos 30 días
  growthRate?: number; // Porcentaje de crecimiento
}

export interface Club {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ClubCategory;
  subcategory?: string;
  privacy: ClubPrivacy;
  
  // Media
  profileImageUrl?: string;
  coverImageUrl?: string;
  
  // Stats
  stats: ClubStats;
  
  // Membership
  membershipTiers: MembershipTier[];
  currentUserRole?: ClubRole;
  currentUserTier?: MembershipTier;
  isMember: boolean;
  isOwner?: boolean; // Indica si el usuario actual es el owner
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
  
  // Verification
  isVerified: boolean;
  
  // Owner
  ownerId: string;
  ownerName?: string;
  ownerAvatar?: string;
  
  // Additional info
  rules?: string[];
  location?: string;
  website?: string;
  tags?: string[];
}

export interface CreateClubDto {
  name: string;
  description: string;
  category: ClubCategory;
  subcategory?: string;
  privacy: ClubPrivacy;
  profileImage?: File;
  coverImage?: File;
  membershipTiers?: MembershipTier[];
  rules?: string[];
  location?: string;
  website?: string;
  tags?: string[];
}

export interface UpdateClubDto {
  name?: string;
  description?: string;
  category?: ClubCategory;
  subcategory?: string;
  privacy?: ClubPrivacy;
  profileImageUrl?: string;
  coverImageUrl?: string;
  rules?: string[];
  location?: string;
  website?: string;
  tags?: string[];
}

export interface SearchClubsParams {
  query?: string;
  category?: ClubCategory;
  privacy?: ClubPrivacy;
  membershipTier?: MembershipTier;
  location?: string;
  tags?: string[];
  minMembers?: number;
  maxMembers?: number;
  verified?: boolean;
  sortBy?: 'name' | 'members' | 'created' | 'activity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface JoinClubDto {
  clubId: string;
  membershipTier?: MembershipTier;
}

export interface LeaveClubDto {
  clubId: string;
}

export interface AssignClubRoleDto {
  clubId: string;
  userId: string;
  role: ClubRole;
}

// API Response types
export interface ClubResponse {
  club: Club;
  userRole?: ClubRole;
  userTier?: MembershipTier;
  isMember: boolean;
}

export interface ClubsListResponse {
  clubs: Club[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

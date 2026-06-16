export type UserRole = "FOLLOWER" | "ARTIST" | "MANAGER" | "PLATFORM_ADMIN";

export type ApiResponse<T> = {
  ok: boolean;
  message: string;
  data: T;
  errors?: unknown;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Paginated<T> = {
  items: T[];
  meta: PaginationMeta;
};

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: UserRole;
  status: string;
  avatarUrl?: string | null;
  city?: string | null;
  country?: string | null;
  artistProfileId?: string | null;
};

export type Discipline = {
  id: string;
  name: string;
  slug: string;
  type: string;
};

export type ArtistProfile = {
  id: string;
  owner?: Pick<User, "id" | "displayName" | "email">;
  slug: string;
  stageName: string;
  legalName?: string | null;
  artistType: string;
  status: string;
  biography?: string | null;
  shortBio?: string | null;
  city: string;
  country: string;
  availability?: string | null;
  website?: string | null;
  profileImageUrl?: string | null;
  coverImageUrl?: string | null;
  isVerified: boolean;
  isFeatured: boolean;
  profileViews: number;
  followerCount: number;
  favoriteCount: number;
  portfolioCount: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  disciplines?: Array<{ discipline: Discipline }>;
  portfolioItems?: PortfolioItem[];
  services?: ServiceOffer[];
  socialLinks?: SocialLink[];
  experiences?: Experience[];
  achievements?: Achievement[];
  educations?: EducationItem[];
  reviews?: Review[];
};

export type PortfolioItem = {
  id: string;
  title: string;
  description?: string | null;
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl?: string | null;
  externalUrl?: string | null;
  year?: number | null;
  role?: string | null;
  credits?: string | null;
  location?: string | null;
  isFeatured: boolean;
  tags: string[];
  status?: string;
  artistProfile?: Pick<ArtistProfile, "id" | "slug" | "stageName" | "city" | "country">;
};

export type ServiceOffer = {
  id: string;
  title: string;
  description?: string | null;
  serviceType: string;
  priceFrom?: string | number | null;
  currency: string;
  duration?: string | null;
  locationMode: string;
  isActive?: boolean;
};

export type Experience = {
  id: string;
  title: string;
  organization?: string | null;
  description?: string | null;
};

export type Achievement = {
  id: string;
  title: string;
  issuer?: string | null;
  description?: string | null;
};

export type EducationItem = {
  id: string;
  title: string;
  institution?: string | null;
  description?: string | null;
};

export type SocialLink = {
  id: string;
  platform: string;
  label?: string | null;
  url: string;
};

export type Opportunity = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  status: string;
  city?: string | null;
  country?: string | null;
  deadline?: string | null;
  isFeatured: boolean;
};

export type EventItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: string;
  startsAt: string;
  city?: string | null;
  country?: string | null;
  coverImageUrl?: string | null;
  artistProfile?: Pick<ArtistProfile, "id" | "slug" | "stageName"> | null;
};

export type Campaign = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  status: string;
  coverImageUrl?: string | null;
  artistProfile?: Pick<ArtistProfile, "id" | "slug" | "stageName"> | null;
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  content: string;
  coverImageUrl?: string | null;
};

export type Review = {
  id: string;
  rating: number;
  title?: string | null;
  comment: string;
  reviewer?: {
    displayName: string;
    avatarUrl?: string | null;
  };
};

export type RequestKind = "contact" | "booking" | "collaboration";

export type ArtistRequest = {
  id: string;
  type: RequestKind;
  artistProfileId: string;
  name: string;
  email: string;
  message?: string | null;
  proposal?: string | null;
  status: string;
  createdAt: string;
  artistProfile?: Pick<ArtistProfile, "id" | "slug" | "stageName">;
};

export type ReportItem = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  details?: string | null;
  status: string;
  createdAt: string;
  reporter?: Pick<User, "id" | "displayName" | "email">;
  reviewer?: Pick<User, "id" | "displayName"> | null;
};

export type ManagerArtistAssignment = {
  id: string;
  artistProfileId: string;
  artistProfile: ArtistProfile;
};

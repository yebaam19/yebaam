export type UserRole = 'STUDENT_OR_PARENT' | 'SCHOOL_ADMIN' | 'PLATFORM_ADMIN';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'LOST';
export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type MediaType = 'PROFILE_IMAGE' | 'COVER_IMAGE' | 'GALLERY' | 'VIDEO_URL' | 'IMAGE' | 'VIDEO' | 'REEL' | 'DOCUMENT';
export type ProgramType = 'COURSE' | 'WORKSHOP' | 'CLASS' | 'INTENSIVE' | 'DIPLOMA';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface SchoolSummary {
  id: string;
  name: string;
  slug: string;
  city: string;
  category: string;
  schoolType: string;
  description: string;
  profileImageUrl?: string | null;
  coverImageUrl?: string | null;
  isVerified: boolean;
}

export interface School extends SchoolSummary {
  aboutArticle: string;
  generalSchedule?: string | null;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  leadFormTitle: string;
  leadFormDescription: string;
  trialClassMessage?: string | null;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
  foundedAt?: string | null;
  capacity?: number | null;
  isActive: boolean;
  programs: Program[];
  instructors: Instructor[];
  campuses: Campus[];
  reviews: Review[];
  campaigns: Campaign[];
  events: SchoolEvent[];
  articles?: Article[];
  faqs: FAQ[];
  mediaAssets: MediaAsset[];
}

export interface ProgramSummary {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  monthlyPrice: number;
  currency: string;
}

export interface Program extends ProgramSummary {
  description: string;
  modality: 'PRESENTIAL' | 'VIRTUAL' | 'HYBRID';
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PROFESSIONAL';
  programType: ProgramType;
  ageRange: string;
  duration: string;
  scheduleSummary: string;
  registrationFee: number;
  enrollmentOpen: boolean;
  trialClassAvailable: boolean;
  materialsIncluded: boolean;
  isFeatured: boolean;
  sortOrder?: number;
  imageUrl?: string | null;
  schoolId: string;
  disciplineId: string;
}

export interface ProgramListItem extends ProgramSummary {
  description: string;
  modality: 'PRESENTIAL' | 'VIRTUAL' | 'HYBRID';
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PROFESSIONAL';
  ageRange: string;
  duration: string;
  programType: ProgramType;
  trialClassAvailable: boolean;
  isFeatured: boolean;
  imageUrl?: string | null;
  school: { id: string; name: string; slug: string; profileImageUrl?: string | null };
  discipline: { id: string; name: string; slug: string };
  instructor?: { id: string; name: string; photoUrl?: string } | null;
}

export interface ProgramListResponse {
  data: ProgramListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Instructor {
  id: string;
  name: string;
  bio: string;
  specialties: string;
  experience?: string | null;
  education?: string | null;
  photoUrl?: string | null;
  instagram?: string | null;
  portfolioUrl?: string | null;
  isActive: boolean;
}

export interface Campus {
  id: string;
  schoolId?: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
}

export interface Review {
  id: string;
  rating: number;
  title: string;
  body: string;
  isPublished: boolean;
  createdAt: string;
  user?: { firstName: string; lastName: string };
}

export interface Campaign {
  id: string;
  title: string;
  campaignType: 'SCHOLARSHIP' | 'DISCOUNT' | 'OPEN_ENROLLMENT' | 'OPEN_CLASS' | 'ENROLLMENT_PROMOTION';
  subtitle?: string;
  description: string;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  startsAt: string;
  endsAt: string;
  isArchived: boolean;
  school?: SchoolSummary;
}

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  eventType: 'RECITAL' | 'AUDITION' | 'SHOWCASE' | 'WORKSHOP' | 'OPEN_CLASS' | 'EXHIBITION' | 'PRESENTATION';
  imageUrl?: string | null;
  startsAt: string;
  endsAt: string;
  location: string;
  isArchived: boolean;
  school?: SchoolSummary;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface MediaAsset {
  id: string;
  schoolId?: string;
  programId?: string | null;
  instructorId?: string | null;
  campaignId?: string | null;
  eventId?: string | null;
  articleId?: string | null;
  relatedType?: string | null;
  relatedId?: string | null;
  type: MediaType | string;
  mediaType?: string | null;
  url: string;
  thumbnailUrl?: string | null;
  publicId?: string | null;
  title?: string | null;
  description?: string | null;
  caption?: string | null;
  provider?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  sortOrder?: number;
  isPrimary: boolean;
  isActive?: boolean;
  createdAt?: string;
  school?: { id: string; name: string; slug: string };
}

export interface Article {
  id: string;
  schoolId: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category?: string | null;
  tags: string[];
  coverImageUrl?: string | null;
  videoUrl?: string | null;
  status: ArticleStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  school?: { id: string; name: string; slug: string; profileImageUrl?: string | null };
  mediaAssets?: MediaAsset[];
}

export interface EnrollmentLeadPayload {
  schoolId: string;
  programId?: string;
  name: string;
  email: string;
  phone: string;
  message?: string;
  preferredContactMethod: 'email' | 'phone' | 'whatsapp';
}

export interface EnrollmentLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message?: string;
  status: LeadStatus;
  preferredContactMethod: string;
  sourceScreen?: string;
  createdAt: string;
  program?: { id: string; name: string; slug: string } | null;
  school?: { id: string; name: string } | null;
}

export interface ScheduleSlot {
  id: string;
  weekday: number;
  startsAt: string;
  endsAt: string;
  capacity: number;
  isActive?: boolean;
  programId?: string;
  campusId?: string | null;
  program?: { id: string; name: string; schoolId: string; school?: { id: string; name: string; slug: string } };
  campus?: { id: string; name: string; city: string; address: string } | null;
}

export interface ProgramDetail extends Omit<Program, 'registrationFee' | 'monthlyPrice'> {
  description: string;
  scheduleSummary: string;
  ageRange: string;
  duration: string;
  registrationFee: number | null;
  monthlyPrice: number | null;
  school: {
    id: string; name: string; slug: string; profileImageUrl?: string | null;
    city: string; isVerified: boolean; phone: string; whatsapp: string;
    email: string; website?: string | null; instagram?: string | null;
  };
  discipline: { id: string; name: string; slug: string };
  instructor: {
    id: string; name: string; bio: string; specialties: string;
    photoUrl?: string | null; instagram?: string | null;
  } | null;
  campus: {
    id: string; name: string; city: string; address: string;
    phone: string; latitude?: number; longitude?: number;
  } | null;
  scheduleSlots: ScheduleSlot[];
  mediaAssets: MediaAsset[];
}

export type TrialStatus = 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface TrialClass {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  message?: string;
  status: TrialStatus;
  createdAt: string;
  program?: { id: string; name: string; slug: string } | null;
  school?: { id: string; name: string } | null;
}

export interface TrialClassPayload {
  schoolId: string;
  programId?: string;
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  message?: string;
}

export interface AdminStats {
  totalSchools: number;
  totalPrograms: number;
  totalLeads: number;
  newLeads: number;
  totalTrialRequests: number;
  pendingTrialRequests: number;
  totalReviews: number;
  upcomingEvents: number;
  activeCampaigns?: number;
  publishedArticles?: number;
  totalMediaAssets?: number;
  leadsByStatus?: Partial<Record<LeadStatus, number>>;
  trialRequestsByStatus?: Partial<Record<TrialStatus, number>>;
}

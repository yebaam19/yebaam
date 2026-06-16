// =====================================================================
// Escuelas — Tipos TypeScript
// Espejo exacto del schema SQL escuelas.*
// Media: cf_image_id / cf_video_uid (Cloudflare)
// =====================================================================

export type SchoolCategory = 'MUSIC' | 'ARTS' | 'DANCE' | 'THEATER' | 'MULTIDISCIPLINARY'
export type SchoolType = 'PRIVATE' | 'PUBLIC' | 'NON_PROFIT' | 'COLLEGE'
export type ProgramModality = 'PRESENTIAL' | 'VIRTUAL' | 'HYBRID'
export type ProgramLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PROFESSIONAL'
export type ProgramType = 'COURSE' | 'WORKSHOP' | 'CLASS' | 'INTENSIVE' | 'DIPLOMA'
export type LeadStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'LOST'
export type TrialStatus = 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
export type EscuelasEventType =
  | 'RECITAL' | 'AUDITION' | 'SHOWCASE' | 'WORKSHOP'
  | 'OPEN_CLASS' | 'EXHIBITION' | 'PRESENTATION'
export type CampaignType =
  | 'SCHOLARSHIP' | 'DISCOUNT' | 'OPEN_ENROLLMENT'
  | 'OPEN_CLASS' | 'ENROLLMENT_PROMOTION'
export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

// ---------------------
// disciplines
// ---------------------
export interface Discipline {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
  updated_at: string
}

// ---------------------
// schools
// ---------------------
export interface School {
  id: string
  created_by: string | null
  name: string
  slug: string
  category: SchoolCategory
  school_type: SchoolType
  description: string
  about_article: string
  general_schedule: string | null
  primary_cta_label: string
  secondary_cta_label: string
  lead_form_title: string
  lead_form_description: string
  trial_class_message: string | null
  profile_cf_image_id: string | null
  cover_cf_image_id: string | null
  is_verified: boolean
  city: string
  address: string
  phone: string
  whatsapp: string
  email: string
  website: string | null
  instagram: string | null
  facebook: string | null
  tiktok: string | null
  youtube: string | null
  founded_at: string | null
  capacity: number | null
  is_active: boolean
  review_count: number
  avg_rating: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface SchoolDetail extends School {
  programs?: Program[]
  instructors?: Instructor[]
  campuses?: Campus[]
  campaigns?: SchoolCampaign[]
  events?: SchoolEvent[]
  faqs?: FAQ[]
  reviews?: Review[]
  media_assets?: MediaAsset[]
  articles?: Article[]
  admins?: SchoolAdmin[]
}

// ---------------------
// school_admins
// ---------------------
export interface SchoolAdmin {
  id: string
  school_id: string
  user_id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// ---------------------
// instructors
// ---------------------
export interface Instructor {
  id: string
  school_id: string
  name: string
  bio: string
  specialties: string
  experience: string | null
  education: string | null
  portfolio_url: string | null
  photo_cf_image_id: string | null
  instagram: string | null
  is_active: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

// ---------------------
// campuses
// ---------------------
export interface Campus {
  id: string
  school_id: string
  name: string
  city: string
  address: string
  phone: string
  latitude: number | null
  longitude: number | null
  is_active: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

// ---------------------
// programs
// ---------------------
export interface Program {
  id: string
  school_id: string
  discipline_id: string
  campus_id: string | null
  instructor_id: string | null
  name: string
  slug: string
  short_description: string
  description: string
  modality: ProgramModality
  level: ProgramLevel
  program_type: ProgramType
  age_range: string
  duration: string
  schedule_summary: string
  monthly_price: number
  registration_fee: number
  currency: string
  cf_image_id: string | null
  enrollment_open: boolean
  trial_class_available: boolean
  materials_included: boolean
  is_featured: boolean
  is_active: boolean
  sort_order: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface ProgramDetail extends Program {
  discipline?: Discipline | null
  campus?: Campus | null
  instructor?: Instructor | null
  schedule_slots?: ScheduleSlot[]
  school?: School | null
  media_assets?: MediaAsset[]
}

// ---------------------
// schedule_slots
// ---------------------
export interface ScheduleSlot {
  id: string
  program_id: string
  campus_id: string | null
  weekday: number
  starts_at: string
  ends_at: string
  capacity: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// ---------------------
// media_assets
// ---------------------
export interface MediaAsset {
  id: string
  school_id: string
  program_id: string | null
  instructor_id: string | null
  type: string
  cf_image_id: string | null
  cf_video_uid: string | null
  thumbnail_cf_image_id: string | null
  title: string | null
  description: string | null
  caption: string | null
  width: number | null
  height: number | null
  duration_seconds: number | null
  sort_order: number
  is_primary: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// ---------------------
// reviews
// ---------------------
export interface Review {
  id: string
  school_id: string
  user_id: string
  rating: number
  title: string
  body: string
  is_published: boolean
  created_at: string
  updated_at: string
  profile?: { username: string; avatar_url: string | null } | null
}

// ---------------------
// campaigns
// ---------------------
export interface SchoolCampaign {
  id: string
  school_id: string
  title: string
  campaign_type: CampaignType
  subtitle: string | null
  description: string
  cf_image_id: string | null
  cta_label: string | null
  cta_url: string | null
  starts_at: string
  ends_at: string
  is_archived: boolean
  created_at: string
  updated_at: string
}

// ---------------------
// events
// ---------------------
export interface SchoolEvent {
  id: string
  school_id: string
  title: string
  description: string
  event_type: EscuelasEventType
  cf_image_id: string | null
  starts_at: string
  ends_at: string
  location: string
  is_archived: boolean
  created_at: string
  updated_at: string
}

// ---------------------
// articles
// ---------------------
export interface Article {
  id: string
  school_id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string | null
  tags: string[]
  cover_cf_image_id: string | null
  video_url: string | null
  status: ArticleStatus
  published_at: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

// ---------------------
// faqs
// ---------------------
export interface FAQ {
  id: string
  school_id: string
  question: string
  answer: string
  sort_order: number
  created_at: string
  updated_at: string
}

// ---------------------
// enrollment_leads
// ---------------------
export interface EnrollmentLead {
  id: string
  school_id: string
  program_id: string | null
  user_id: string | null
  name: string
  email: string
  phone: string
  message: string | null
  preferred_contact_method: string
  status: LeadStatus
  source_screen: string | null
  created_at: string
}

// ---------------------
// trial_class_requests
// ---------------------
export interface TrialClassRequest {
  id: string
  school_id: string
  program_id: string | null
  user_id: string | null
  name: string
  email: string
  phone: string
  preferred_date: string
  message: string | null
  status: TrialStatus
  created_at: string
}

// ---------------------
// Form inputs
// ---------------------
export interface CreateSchoolInput {
  name: string
  slug: string
  category: SchoolCategory
  school_type: SchoolType
  description: string
  about_article?: string
  city: string
  address: string
  phone: string
  whatsapp: string
  email: string
  website?: string
  instagram?: string
  facebook?: string
  tiktok?: string
  youtube?: string
  profile_cf_image_id?: string
  cover_cf_image_id?: string
}

export interface CreateProgramInput {
  school_id: string
  discipline_id: string
  campus_id?: string
  instructor_id?: string
  name: string
  slug: string
  short_description: string
  description: string
  modality: ProgramModality
  level: ProgramLevel
  program_type?: ProgramType
  age_range: string
  duration: string
  schedule_summary: string
  monthly_price: number
  registration_fee?: number
  currency?: string
  cf_image_id?: string
  enrollment_open?: boolean
  trial_class_available?: boolean
}

export interface CreateInstructorInput {
  school_id: string
  name: string
  bio: string
  specialties: string
  experience?: string
  education?: string
  portfolio_url?: string
  photo_cf_image_id?: string
  instagram?: string
}

export interface CreateCampusInput {
  school_id: string
  name: string
  city: string
  address: string
  phone: string
  latitude?: number
  longitude?: number
}

export interface SubmitLeadInput {
  school_id: string
  program_id?: string
  name: string
  email: string
  phone: string
  message?: string
  preferred_contact_method: string
  source_screen?: string
}

export interface SubmitTrialClassInput {
  school_id: string
  program_id?: string
  name: string
  email: string
  phone: string
  preferred_date: string
  message?: string
}

export interface SchoolFilters {
  category?: SchoolCategory
  city?: string
  search?: string
  page?: number
  limit?: number
}

export interface ProgramFilters {
  school_id?: string
  discipline_id?: string
  modality?: ProgramModality
  level?: ProgramLevel
  trial_class_available?: boolean
  search?: string
  page?: number
  limit?: number
}

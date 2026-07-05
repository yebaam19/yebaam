/**
 * Professional Profile Interfaces
 *
 * Interfaces para el perfil profesional del usuario
 * Basado en los modelos de Prisma
 */

// Enums
export type ProfessionalProfileVisibility = 'PUBLIC' | 'PRIVATE' | 'LIMITED'

export type TitleCategory =
  | 'bachiller'
  | 'tecnico'
  | 'tecnologo'
  | 'asociado'
  | 'licenciatura'
  | 'maestria'
  | 'doctorado'

export type TitleDistinction =
  | 'cum_laude'
  | 'magna_cum_laude'
  | 'summa_cum_laude'
  | 'mejor_estudiante'
  | 'segundo_mejor_estudiante'
  | 'tercer_mejor_estudiante'

export type StudyType = 'certificado' | 'diploma' | 'diplomado' | 'curso' | 'bootcamp'

export type CredentialStatus =
  | 'none'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'review_needed'

export type CredentialTargetKind = 'title' | 'study'

export interface CredentialFields {
  credentialStatus: CredentialStatus
  credentialRequestId?: string | null
  verifiedAt?: string | Date | null
  verifiedBy?: string | null
  // Owner-only field. Public hydration omits this.
  diplomaCfImageId?: string | null
  verifiedSnapshot?: Record<string, unknown> | null
  institutionPageId?: string | null
  institutionSlug?: string | null
}

// Main Professional Profile
export interface ProfessionalProfile {
  id: string
  userId: string
  visibility: ProfessionalProfileVisibility
  avatarUrl?: string | null
  coverUrl?: string | null
  bio?: string | null
  createdAt: string | Date
  updatedAt: string | Date
  // Relations
  titles?: Title[]
  studies?: Study[]
  associations?: Association[]
  licenses?: License[]
  skills?: Skill[]
  languages?: Language[]
  experience?: Experience[]
  posts?: ProfessionalPost[]
  followers?: ProfessionalProfileFollow[]
  user?: {
    id: string
    firstName: string
    lastName: string
    username: string
    avatar?: string | null
    identityVerified?: boolean
    identityVerifiedAt?: string | null
  }
  _count?: {
    titles: number
    studies: number
    experience: number
    skills: number
    languages: number
    licenses: number
    associations: number
    followers: number
    posts: number
  }
}

// Related entities (según modelos de Prisma)
export interface Title extends CredentialFields {
  id: string
  professionalProfileId: string
  name: string
  institution?: string | null
  year?: number | null
  category?: TitleCategory | null
  distinction?: TitleDistinction | null
  focuses: string[]
}

export interface Study extends CredentialFields {
  id: string
  professionalProfileId: string
  name: string
  institution?: string | null
  year?: number | null
  studyType?: StudyType | null
  focuses: string[]
}

export interface Association {
  id: string
  professionalProfileId: string
  name: string
  role?: string | null
}

export interface License {
  id: string
  professionalProfileId: string
  name: string
  number?: string | null
  issuedBy?: string | null
  issuedAt?: string | Date | null
}

export interface Skill {
  id: string
  professionalProfileId: string
  name: string
  level?: string | null
}

export interface Language {
  id: string
  professionalProfileId: string
  name: string
  proficiency?: string | null
}

export interface Experience {
  id: string
  professionalProfileId: string
  position: string
  company?: string | null
  startDate?: string | Date | null
  endDate?: string | Date | null
  description?: string | null
}

export interface ProfessionalPost {
  id: string
  professionalProfileId: string
  content: string
  createdAt: string | Date
  updatedAt: string | Date
  _count?: {
    likes: number
  }
}

export interface ProfessionalProfileFollow {
  id: string
  followerId: string
  professionalProfileId: string
  createdAt: string | Date
}

// DTOs for creating/updating
export interface CreateProfessionalProfileDTO {
  visibility: ProfessionalProfileVisibility
}

export interface UpdateProfessionalProfileDTO {
  visibility?: ProfessionalProfileVisibility
  avatarUrl?: string
  coverUrl?: string
  /** Bare Cloudflare Images id for the avatar. When omitted, the server derives it from avatarUrl. */
  avatarCloudflareId?: string | null
  /** Bare Cloudflare Images id for the cover. When omitted, the server derives it from coverUrl. */
  coverCloudflareId?: string | null
  bio?: string
}

export interface TitleFormData {
  name: string
  institution?: string
  year?: number
  category?: TitleCategory | null
  distinction?: TitleDistinction | null
  focuses?: string[]
  institutionSlug?: string | null
}

export interface StudyFormData {
  name: string
  institution?: string
  year?: number
  studyType?: StudyType | null
  focuses?: string[]
  institutionSlug?: string | null
}

export interface AssociationFormData {
  name: string
  role?: string
}

export interface LicenseFormData {
  name: string
  number?: string
  issuedBy?: string
  issuedAt?: string
}

export interface SkillFormData {
  name: string
  level?: string
}

export interface LanguageFormData {
  name: string
  proficiency?: string
}

export interface ExperienceFormData {
  position: string
  company?: string
  startDate?: string
  endDate?: string
  description?: string
}

// Access types
export interface ProfileAccessInfo {
  hasAccess: boolean
  visibility: ProfessionalProfileVisibility
  isOwnProfile: boolean
}

export type CredentialRequestStatus = Exclude<CredentialStatus, 'none'>

export interface ProfessionalCredentialRequest {
  id: string
  userId: string
  targetKind: CredentialTargetKind
  titleId?: string | null
  studyId?: string | null
  evidenceCfImageId: string
  mimeType?: string | null
  submittedSnapshot: Record<string, unknown>
  status: CredentialRequestStatus
  submittedAt: string | Date
  reviewedAt?: string | Date | null
  reviewedBy?: string | null
  adminNotes?: string | null
  rejectionReason?: string | null
}

export interface DegreeBadge {
  kind: CredentialTargetKind
  itemId: string
  category?: TitleCategory | null
  studyType?: StudyType | null
  distinction?: TitleDistinction | null
  institution?: string | null
  institutionSlug?: string | null
  verifiedAt: string | Date
}

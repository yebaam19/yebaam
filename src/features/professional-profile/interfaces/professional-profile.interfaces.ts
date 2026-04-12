/**
 * Professional Profile Interfaces
 *
 * Interfaces para el perfil profesional del usuario
 * Basado en los modelos de Prisma
 */

// Enums
export type ProfessionalProfileVisibility = 'PUBLIC' | 'PRIVATE' | 'LIMITED'

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
export interface Title {
  id: string
  professionalProfileId: string
  name: string
  institution?: string | null
  year?: number | null
}

export interface Study {
  id: string
  professionalProfileId: string
  name: string
  institution?: string | null
  year?: number | null
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
  bio?: string
}

export interface TitleFormData {
  name: string
  institution?: string
  year?: number
}

export interface StudyFormData {
  name: string
  institution?: string
  year?: number
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

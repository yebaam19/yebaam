
import type { ProfileBadge } from '@/features/badges/types/badges.types'

export interface UserProfile {
  id: string
  userId: string
  username: string
  firstName?: string
  secondName?: string
  lastName?: string
  secondLastName?: string
  displayName: string
  avatarUrl?: string | null
  coverPhotoUrl?: string | null
  coverUrl?: string | null //TO DO: Deprecated: usar coverPhotoUrl
  /** Saved transform offset X (0..100). Default 50 = horizontally centered. */
  coverOffsetX?: number | null
  /** Saved transform offset Y (0..100). Default 50 = vertically centered. */
  coverOffsetY?: number | null
  /** Zoom factor as integer percent (100..400). 100 = 1.0×. */
  coverZoom?: number | null
  idDocumentUrl?: string | null
  bio?: string | null
  documentStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PUBLIC' | null
  isVerified?: boolean
  pioneerNumber?: number | null
  uniqueIdCode?: string | null

  // Location info
  residenceCountry?: string | null
  residenceState?: string | null
  residenceCity?: string | null
  birthCountry?: string | null
  birthState?: string | null
  birthCity?: string | null
  birthDate?: Date | null // Cambiado de 'birthdate' a 'birthDate' para coincidir con el backend

  // Personal info
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null
  bloodType?: string | null
  relationshipStatus?: 'SINGLE' | 'IN_RELATIONSHIP' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | null

  // Contact
  email?: string
  phone?: string | null

  // Social links
  websiteUrl?: string | null
  facebookUrl?: string | null
  instagramUrl?: string | null
  twitterUrl?: string | null
  linkedinUrl?: string | null
  githubUrl?: string | null

  // Languages spoken (text[] in DB)
  languages?: string[]

  // Interests
  interests?: string[]

  // Favorites — text[] columns persisted to profiles.
  // Renamed from legacy `tvShows`/`musicBands` for DB-column parity.
  favoriteTvShows?: string[]
  favoriteMusic?: string[]
  favoriteMovies?: string[]
  favoriteBooks?: string[]
  favoriteGames?: string[]

  // Work and Study
  studyPlace?: string | null
  workPlace?: string | null

  // Stats
  _count?: {
    posts: number
    followers: number
    following: number
    sentFriendRequests: number
    receivedFriendRequests: number
  }

  /** Insignias rendered inline next to the display name (verified, pioneer, study level, ...). */
  insignias?: ProfileBadge[]
  /** Specific awards rendered in the horizontal strip below the cover photo. */
  badges?: ProfileBadge[]
  /** Grants the user has not yet accepted/declined. Only populated for own profile. */
  pendingBadges?: ProfileBadge[]

  // Dates
  createdAt: Date
  updatedAt: Date
}

export interface UpdateProfileDTO {
  firstName?: string
  secondName?: string
  lastName?: string
  secondLastName?: string
  avatarUrl?: string
  coverPhotoUrl?: string
  /** 0..100 — saved cover X offset percentage. */
  coverOffsetX?: number
  /** 0..100 — saved cover Y offset percentage. */
  coverOffsetY?: number
  /** 100..400 — zoom factor in integer percent. */
  coverZoom?: number
  idDocumentUrl?: string
  bio?: string
  websiteUrl?: string
  relationshipStatus?: string
  studyPlace?: string
  workPlace?: string
  gender?: string
  birthDate?: string // Backend espera 'birthDate' como string en formato ISO (YYYY-MM-DD)
  residenceCity?: string
  birthCity?: string
  phone?: string // Teléfono del usuario
  // Social URLs (persisted to dedicated columns)
  facebookUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  githubUrl?: string
  // Tag-style collections
  interests?: string[]
  languages?: string[]
  favoriteTvShows?: string[]
  favoriteMusic?: string[]
  favoriteMovies?: string[]
  favoriteBooks?: string[]
  favoriteGames?: string[]
}

export interface UpdatePersonalInfoDTO {
  bio?: string
  residenceCountry?: string
  residenceState?: string
  residenceCity?: string
  birthCountry?: string
  birthState?: string
  birthCity?: string
  birthdate?: Date
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  bloodType?: string
  relationshipStatus?: 'SINGLE' | 'IN_RELATIONSHIP' | 'MARRIED' | 'DIVORCED' | 'WIDOWED'
  phone?: string
}

export interface UpdateSocialLinksDTO {
  websiteUrl?: string
  facebookUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  githubUrl?: string
}

export interface UpdateInterestsDTO {
  interests: string[]
}

export interface UploadImageResponse {
  url: string
  publicId?: string
}

export interface ProfileStatsResponse {
  posts: number
  followers: number
  following: number
  friends: number
}

export interface FriendshipStatus {
  status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED'
  isRequester: boolean
  friendCount: number
}

// ============================================================================
// CIUDAD Y USUARIO (Relaciones)
// ============================================================================

export interface ServiceCity {
  id: string
  name: string
  slug: string
  state?: {
    id: string
    name: string
  }
  country: {
    id: string
    name: string
  }
}

export interface ServiceOwner {
  id: string
  username: string
  firstName: string
  lastName: string
  avatarUrl?: string
  coverUrl?: string
  bio?: string
  email?: string
  isVerified?: boolean
  professionalProfileId?: string
}

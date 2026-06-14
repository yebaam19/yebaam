// ============================================================================
// REVIEWS
// ============================================================================

export interface ProfessionalServiceReviewAuthor {
  id: string
  username: string
  firstName: string
  lastName: string
  avatarUrl?: string
}

export interface ProfessionalServiceReview {
  id: string
  serviceId: string
  userId: string
  rating: number // 1-5
  comment?: string
  createdAt: string
  updatedAt: string
  user: ProfessionalServiceReviewAuthor
}

export interface PageReview {
  id: string;
  pageId: string;
  userId: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    profilePicture: string | null;
    isVerified: boolean;
  };
  rating: number;
  comment: string;
  photos: string[];
  helpfulCount: number;
  isHelpfulByCurrentUser?: boolean;
  ownerResponse: string | null;
  ownerRespondedAt: Date | null;
  isEdited: boolean;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PageReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface GetReviewsResponse {
  reviews: PageReview[];
  total: number;
  hasMore: boolean;
}

export interface CreateReviewInput {
  rating: number;
  comment: string;
  photos?: {
    url: string;
    s3Key: string;
  }[];
}

export interface UpdateReviewInput {
  rating?: number;
  comment?: string;
  photos?: {
    url: string;
    s3Key: string;
  }[];
}

export interface OwnerResponseInput {
  response: string;
}

export type ReviewSortBy = 'recent' | 'helpful' | 'rating-high' | 'rating-low';
export type ReviewFilterBy = 'all' | '5' | '4' | '3' | '2' | '1';

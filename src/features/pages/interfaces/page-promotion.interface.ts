export enum PromotionType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  BOGO = 'bogo',
  FREE_SHIPPING = 'free_shipping',
  BUNDLE = 'bundle',
}

export interface PagePromotion {
  id: string;
  pageId: string;
  title: string;
  description: string;
  type: PromotionType;
  value: number;
  code: string | null;
  startDate: Date;
  endDate: Date;
  terms: string | null;
  isActive: boolean;
  usageLimit: number | null;
  usageCount: number;
  applicableProducts: string[];
  imageUrl: string | null;
  isFeatured: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Computed fields
  isExpired?: boolean;
  isUpcoming?: boolean;
  daysRemaining?: number;
}

export interface CreatePromotionInput {
  title: string;
  description: string;
  type: PromotionType;
  value: number;
  code?: string;
  startDate: Date;
  endDate: Date;
  terms?: string;
  isActive?: boolean;
  usageLimit?: number;
  applicableProducts?: string[];
  imageUrl?: string;
  s3Key?: string;
  isFeatured?: boolean;
}

export interface UpdatePromotionInput {
  title?: string;
  description?: string;
  type?: PromotionType;
  value?: number;
  code?: string;
  startDate?: Date;
  endDate?: Date;
  terms?: string;
  isActive?: boolean;
  usageLimit?: number;
  applicableProducts?: string[];
  imageUrl?: string;
  s3Key?: string;
  isFeatured?: boolean;
}

export interface ValidateCodeResponse {
  valid: boolean;
  message?: string;
  promotion?: PagePromotion;
}

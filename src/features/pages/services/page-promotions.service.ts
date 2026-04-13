import { getAxiosInstance } from '@/lib/legacy-api/client';
import {
  PagePromotion,
  CreatePromotionInput,
  UpdatePromotionInput,
  ValidateCodeResponse,
} from '../interfaces/page-promotion.interface';

const axios = getAxiosInstance();
const baseUrl = '/api/pages';

export const pagePromotionsService = {
  /**
   * Get all promotions for a page
   */
  async getPagePromotions(
    pageId: string,
    includeInactive: boolean = false,
  ): Promise<PagePromotion[]> {
    const response = await axios.get<PagePromotion[]>(
      `${baseUrl}/${pageId}/promotions`,
      {
        params: { includeInactive },
      },
    );
    return response.data;
  },

  /**
   * Get only active promotions
   */
  async getActivePromotions(pageId: string): Promise<PagePromotion[]> {
    const response = await axios.get<PagePromotion[]>(
      `${baseUrl}/${pageId}/promotions/active`,
    );
    return response.data;
  },

  /**
   * Create a new promotion
   */
  async createPromotion(
    pageId: string,
    input: CreatePromotionInput,
  ): Promise<PagePromotion> {
    const response = await axios.post<PagePromotion>(
      `${baseUrl}/${pageId}/promotions`,
      input,
    );
    return response.data;
  },

  /**
   * Update an existing promotion
   */
  async updatePromotion(
    pageId: string,
    promotionId: string,
    input: UpdatePromotionInput,
  ): Promise<PagePromotion> {
    const response = await axios.patch<PagePromotion>(
      `${baseUrl}/${pageId}/promotions/${promotionId}`,
      input,
    );
    return response.data;
  },

  /**
   * Delete a promotion
   */
  async deletePromotion(pageId: string, promotionId: string): Promise<void> {
    await axios.delete(`${baseUrl}/${pageId}/promotions/${promotionId}`);
  },

  /**
   * Validate a promotion code
   */
  async validateCode(
    pageId: string,
    code: string,
  ): Promise<ValidateCodeResponse> {
    const response = await axios.get<ValidateCodeResponse>(
      `${baseUrl}/${pageId}/promotions/validate/${code}`,
    );
    return response.data;
  },
};

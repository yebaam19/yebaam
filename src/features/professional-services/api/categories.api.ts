/**
 * Categories API Client
 *
 * The category taxonomy is a static source-of-truth TS file transcribed from
 * the spec (public/SERVICIOS-PROFESIONALES.pdf) — there is no DB table for it.
 * Services reference a category id string; subcategories live per-service.
 */

import type { ProfessionalServiceCategory } from '../interfaces/professional-service.interfaces'
import { SERVICE_CATEGORIES } from '../data/service-categories-taxonomy'

class CategoriesApiClient {
  async getAll(): Promise<ProfessionalServiceCategory[]> {
    return SERVICE_CATEGORIES
  }

  async getById(id: string): Promise<ProfessionalServiceCategory | null> {
    return SERVICE_CATEGORIES.find((cat) => cat.id === id) ?? null
  }
}

export const categoriesApiClient = new CategoriesApiClient()

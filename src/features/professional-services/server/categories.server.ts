import 'server-only'

import {
  SERVICE_CATEGORIES,
  findCategoryById,
  getSubcategoriesForCategory,
} from '../data/service-categories-taxonomy'
import type {
  ProfessionalServiceCategory,
  ProfessionalServiceSubcategory,
} from '../interfaces/professional-service.interfaces'

/**
 * Category reads for the professional-services feature. The category/subcategory
 * taxonomy is a static source-of-truth file (`../data/service-categories-taxonomy`,
 * transcribed from the product spec), so these are pure lookups — exposed
 * through the server layer so callers read categories the same way they read
 * services, rather than reaching into the raw data module.
 */

/** All top-level service categories, in spec order. */
export function getServiceCategories(): ProfessionalServiceCategory[] {
  return SERVICE_CATEGORIES
}

/** Resolve a single category by its taxonomy id (undefined when unknown). */
export function getServiceCategoryById(id: string): ProfessionalServiceCategory | undefined {
  return findCategoryById(id)
}

/** Subcategories under a given category id (empty when the id is unknown). */
export function getServiceSubcategories(categoryId: string): ProfessionalServiceSubcategory[] {
  return getSubcategoriesForCategory(categoryId)
}

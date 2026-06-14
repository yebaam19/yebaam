/**
 * Professional services category taxonomy — single source of truth.
 *
 * Transcribed from the product spec (public/SERVICIOS-PROFESIONALES.pdf):
 * the professional picks a parent **category** and then one or more
 * **subcategories**. Names are kept verbatim (Spanish, with accents) for
 * display; IDs are derived by slugifying + stripping accents so they are
 * stable and URL-safe. Subcategory IDs are namespaced under their parent
 * (`<categoryId>__<subSlug>`) because the same subcategory name can appear
 * under more than one parent (e.g. "Coaching ejecutivo", "Investigación de
 * mercados") and we need globally-unique IDs.
 *
 * The raw entries are split by category family into the sibling modules below
 * and re-concatenated here in the EXACT original order so the materialised
 * taxonomy (and every derived id/slug) is unchanged.
 */

import type {
  ProfessionalServiceCategory,
  ProfessionalServiceSubcategory,
} from '../../interfaces/professional-service.interfaces'
import { buildTaxonomyCategory, type RawCategory, type TaxonomyCategory } from './_types'
import { BUSINESS_ADMIN } from './business-admin'
import { TECH_MARKETING_DESIGN } from './tech-marketing-design'
import { ENGINEERING_CONSTRUCTION } from './engineering-construction'
import { HEALTH_EDUCATION_COMM } from './health-education-comm'
import { SECTORS } from './sectors'
import { SPECIALIZED_EMERGING } from './specialized-emerging'
import { SOCIAL_SCIENCES } from './social-sciences'

const RAW_TAXONOMY: RawCategory[] = [
  ...BUSINESS_ADMIN,
  ...TECH_MARKETING_DESIGN,
  ...ENGINEERING_CONSTRUCTION,
  ...HEALTH_EDUCATION_COMM,
  ...SECTORS,
  ...SPECIALIZED_EMERGING,
  ...SOCIAL_SCIENCES,
]

export const SERVICE_CATEGORY_TAXONOMY: TaxonomyCategory[] = RAW_TAXONOMY.map(buildTaxonomyCategory)

/**
 * Flat list of parent categories (shape `ProfessionalServiceCategory[]`).
 * This is what the mock backend / category dropdowns consume; each entry
 * still carries its `subcategories` for the create flow.
 */
export const SERVICE_CATEGORIES: ProfessionalServiceCategory[] = SERVICE_CATEGORY_TAXONOMY

export function findCategoryById(id: string): TaxonomyCategory | undefined {
  return SERVICE_CATEGORY_TAXONOMY.find((c) => c.id === id)
}

export function getSubcategoriesForCategory(categoryId: string): ProfessionalServiceSubcategory[] {
  return findCategoryById(categoryId)?.subcategories ?? []
}

export function findSubcategoryById(id: string): ProfessionalServiceSubcategory | undefined {
  for (const cat of SERVICE_CATEGORY_TAXONOMY) {
    const match = cat.subcategories.find((s) => s.id === id)
    if (match) return match
  }
  return undefined
}

export type { TaxonomyCategory }

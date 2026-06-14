import type {
  ProfessionalServiceCategory,
  ProfessionalServiceSubcategory,
} from '../../interfaces/professional-service.interfaces'

export interface RawCategory {
  name: string
  description: string
  subcategories: string[]
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics (á → a, ñ → n)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** A category with its subcategories materialised (taxonomy node). */
export interface TaxonomyCategory extends ProfessionalServiceCategory {
  slug: string
  subcategories: ProfessionalServiceSubcategory[]
}

export function buildTaxonomyCategory(cat: RawCategory): TaxonomyCategory {
  const slug = slugify(cat.name)
  const id = `cat-${slug}`
  return {
    id,
    name: cat.name,
    slug,
    description: cat.description,
    createdAt: '2024-01-01T00:00:00Z',
    subcategories: cat.subcategories.map((sub) => {
      const subSlug = slugify(sub)
      return {
        id: `${id}__${subSlug}`,
        name: sub,
        slug: subSlug,
        parentId: id,
      }
    }),
  }
}

/**
 * Subcategoría de un servicio profesional (taxonomía del PDF).
 * El usuario elige una categoría y luego una o varias subcategorías.
 */
export interface ProfessionalServiceSubcategory {
  id: string
  name: string
  slug: string
  parentId?: string
}

export interface ProfessionalServiceCategory {
  id: string
  name: string
  description?: string
  iconUrl?: string
  createdAt: string
  /** Slug URL-safe derivado del nombre (taxonomía). */
  slug?: string
  /** Para subcategorías presentadas como categoría; vacío en padres. */
  parentId?: string
  /** Subcategorías de esta categoría padre (taxonomía del PDF). */
  subcategories?: ProfessionalServiceSubcategory[]
}

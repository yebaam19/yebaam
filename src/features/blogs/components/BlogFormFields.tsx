'use client'

import { BLOG_CATEGORIES, type BlogCategory } from '../types/blog.types'
import { getCategoryLabel } from '../utils/blogHelpers'

export type { BlogCategory }

export interface BlogFormData {
  name: string
  description: string
  category: BlogCategory
  subcategory: string
  website: string
  tags: string
}

interface BlogFormFieldsProps {
  formData: BlogFormData
  onChange: (data: Partial<BlogFormData>) => void
  disabled?: boolean
}

export const BlogFormFields = ({ formData, onChange, disabled = false }: BlogFormFieldsProps) => {
  return (
    <div className="space-y-4">
      {/* Nombre */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Nombre del blog *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Mi Blog Increíble"
          maxLength={100}
          disabled={disabled}
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 focus:border-transparent focus:ring-2 focus:ring-primary-500 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          required
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{formData.name.length}/100 caracteres</p>
      </div>

      {/* Descripción */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Descripción *</label>
        <textarea
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Describe de qué trata tu blog..."
          maxLength={500}
          rows={4}
          disabled={disabled}
          className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 focus:border-transparent focus:ring-2 focus:ring-primary-500 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          required
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {formData.description.length}/500 caracteres
        </p>
      </div>

      {/* Categoría */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Categoría *</label>
        <select
          value={formData.category}
          onChange={(e) => onChange({ category: e.target.value as BlogCategory })}
          disabled={disabled}
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 focus:border-transparent focus:ring-2 focus:ring-primary-500 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        >
          {BLOG_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {getCategoryLabel(category)}
            </option>
          ))}
        </select>
      </div>

      {/* Subcategoría */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Subcategoría (opcional)
        </label>
        <input
          type="text"
          value={formData.subcategory}
          onChange={(e) => onChange({ subcategory: e.target.value })}
          placeholder="ej. Desarrollo Web, Recetas Veganas, etc."
          maxLength={100}
          disabled={disabled}
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 focus:border-transparent focus:ring-2 focus:ring-primary-500 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        />
      </div>

      {/* Website */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Sitio web (opcional)
        </label>
        <input
          type="url"
          value={formData.website}
          onChange={(e) => onChange({ website: e.target.value })}
          placeholder="https://miblog.com"
          disabled={disabled}
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 focus:border-transparent focus:ring-2 focus:ring-primary-500 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Etiquetas (opcional)
        </label>
        <input
          type="text"
          value={formData.tags}
          onChange={(e) => onChange({ tags: e.target.value })}
          placeholder="javascript, react, web development"
          disabled={disabled}
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 focus:border-transparent focus:ring-2 focus:ring-primary-500 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Separa las etiquetas con comas</p>
      </div>
    </div>
  )
}

export { BLOG_CATEGORIES }


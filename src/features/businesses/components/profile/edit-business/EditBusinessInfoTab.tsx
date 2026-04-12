'use client'

/**
 * EditBusinessInfoTab Component
 *
 * Tab para editar información básica del negocio.
 */

import { useBusinessCategories } from '@/features/businesses/hooks'
import { InformationCircleIcon, TagIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

interface EditBusinessInfoTabProps {
  name: string
  slug: string
  description: string
  tags: string[]
  categoryId: string
  onNameChange: (value: string) => void
  onSlugChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onTagsChange: (value: string[]) => void
  onCategoryChange: (value: string) => void
}

/**
 * Genera un slug a partir del nombre
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales por guiones
    .replace(/^-+|-+$/g, '') // Remover guiones al inicio y final
}

/**
 * Tab de edición de información básica
 */
export function EditBusinessInfoTab({
  name,
  slug,
  description,
  tags,
  categoryId,
  onNameChange,
  onSlugChange,
  onDescriptionChange,
  onTagsChange,
  onCategoryChange,
}: EditBusinessInfoTabProps) {
  const [newTag, setNewTag] = useState('')
  const [autoSlug, setAutoSlug] = useState(true)

  // Fetch categories from API
  const { data: categories = [], isLoading: loadingCategories } = useBusinessCategories()

  // Manejar cambio de nombre
  const handleNameChange = (value: string) => {
    onNameChange(value)
    if (autoSlug) {
      onSlugChange(generateSlug(value))
    }
  }

  // Añadir tag
  const addTag = () => {
    const trimmedTag = newTag.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      onTagsChange([...tags, trimmedTag])
      setNewTag('')
    }
  }

  // Remover tag
  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove))
  }

  // Manejar Enter en input de tags
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Name */}
      <div>
        <label
          htmlFor="business-name"
          className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Nombre del negocio <span className="text-red-500">*</span>
        </label>
        <input
          id="business-name"
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Mi Negocio"
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500"
        />
      </div>

      {/* Slug */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="business-slug" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            URL del negocio <span className="text-red-500">*</span>
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={autoSlug}
              onChange={(e) => setAutoSlug(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-neutral-500 dark:text-neutral-400">Generar automáticamente</span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">/feed/businesses/</span>
          <input
            id="business-slug"
            type="text"
            value={slug}
            onChange={(e) => {
              setAutoSlug(false)
              onSlugChange(e.target.value)
            }}
            placeholder="mi-negocio"
            className="flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label
          htmlFor="business-category"
          className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Categoría <span className="text-red-500">*</span>
        </label>
        <select
          id="business-category"
          value={categoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          disabled={loadingCategories}
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
        >
          <option value="">{loadingCategories ? 'Cargando categorías...' : 'Seleccionar categoría'}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="business-description"
          className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Descripción
        </label>
        <p className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">
          Describe tu negocio, servicios que ofreces, horarios especiales, etc.
        </p>
        <textarea
          id="business-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Escribe una descripción de tu negocio..."
          rows={5}
          className="w-full resize-none rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500"
        />
        <div className="mt-1 text-right text-xs text-neutral-500">{description.length}/1000 caracteres</div>
      </div>

      {/* Tags */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Etiquetas</label>
        <p className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">
          Añade etiquetas para ayudar a las personas a encontrar tu negocio. Máximo 10 etiquetas.
        </p>

        {/* Current Tags */}
        {tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
              >
                <TagIcon className="h-3 w-3" />
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 rounded-full p-0.5 transition-colors hover:bg-primary-200 dark:hover:bg-primary-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add Tag Input */}
        {tags.length < 10 && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Agregar etiqueta..."
              className="flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            />
            <button
              onClick={addTag}
              disabled={!newTag.trim()}
              className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              Agregar
            </button>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-700/50">
        <div className="flex gap-3">
          <InformationCircleIcon className="h-5 w-5 shrink-0 text-neutral-500" />
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              La información que proporciones será visible para todos los usuarios. Asegúrate de que sea precisa y
              profesional.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

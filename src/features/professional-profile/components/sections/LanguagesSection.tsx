/**
 * LanguagesSection Component
 *
 * Sección para mostrar y gestionar los idiomas
 */

'use client'

import { cn } from '@/lib/utils'
import { LanguageIcon, PencilIcon, TrashIcon } from '@/components/icons/heroicons-shim'
import { useState } from 'react'
import { useAddLanguage, useDeleteLanguage, useUpdateLanguage } from '../../hooks'
import type { Language } from '../../interfaces/professional-profile.interfaces'
import { DeleteConfirmDialog } from '../dialogs/DeleteConfirmDialog'
import { LanguageDialog } from '../dialogs/LanguageDialog'
import { EmptyState, SectionHeader } from './shared'

interface LanguagesSectionProps {
  profileId: string
  isOwner: boolean
  items?: Language[]
}

// Colores para diferentes niveles de competencia (string)
const getProficiencyColor = (proficiency?: string | null): string => {
  if (!proficiency) return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
  const lower = proficiency.toLowerCase()
  if (lower.includes('nativo') || lower.includes('native') || lower.includes('c2')) {
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  }
  if (lower.includes('avanzado') || lower.includes('advanced') || lower.includes('c1')) {
    return 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400'
  }
  if (lower.includes('intermedio') || lower.includes('intermediate') || lower.includes('b')) {
    return 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
  }
  if (lower.includes('básico') || lower.includes('basic') || lower.includes('principiante') || lower.includes('a')) {
    return 'bg-neutral-200 text-neutral-800 dark:bg-neutral-600 dark:text-neutral-200'
  }
  return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
}

export function LanguagesSection({ profileId, isOwner, items = [] }: LanguagesSectionProps) {
  const { mutateAsync: addLanguage } = useAddLanguage()
  const { mutateAsync: updateLanguage } = useUpdateLanguage()
  const { mutateAsync: deleteLanguage } = useDeleteLanguage()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null)

  const handleAdd = () => {
    setSelectedLanguage(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (language: Language) => {
    setSelectedLanguage(language)
    setIsDialogOpen(true)
  }

  const handleDelete = (language: Language) => {
    setSelectedLanguage(language)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (selectedLanguage) {
      await deleteLanguage({ profileId, languageId: selectedLanguage.id })
      setIsDeleteDialogOpen(false)
      setSelectedLanguage(null)
    }
  }

  return (
    <div>
      <SectionHeader
        title="Idiomas"
        count={items.length}
        onAdd={handleAdd}
        addLabel="Agregar Idioma"
        showAdd={isOwner}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={LanguageIcon}
          title="Sin idiomas registrados"
          description={
            isOwner
              ? 'Agrega los idiomas que dominas y tu nivel de competencia'
              : 'Este usuario aun no ha agregado idiomas a su perfil'
          }
          actionLabel={isOwner ? 'Agregar Idioma' : undefined}
          onAction={isOwner ? handleAdd : undefined}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((language: Language) => (
            <div
              key={language.id}
              className="group flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
                  <LanguageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900 dark:text-white">{language.name}</h3>
                  {language.proficiency && (
                    <span
                      className={cn(
                        'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                        getProficiencyColor(language.proficiency)
                      )}
                    >
                      {language.proficiency}
                    </span>
                  )}
                </div>
              </div>

              {isOwner && (
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleEdit(language)}
                    className="cursor-pointer rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(language)}
                    className="cursor-pointer rounded-lg p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <LanguageDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        language={selectedLanguage}
        onSubmit={async (data) => {
          if (selectedLanguage) {
            await updateLanguage({ profileId, languageId: selectedLanguage.id, data })
          } else {
            await addLanguage({ profileId, data })
          }
          setIsDialogOpen(false)
        }}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Idioma"
        description="¿Estas seguro de que deseas eliminar este idioma? Esta accion no se puede deshacer."
      />
    </div>
  )
}

/**
 * TitlesSection Component
 *
 * Sección para mostrar y gestionar los títulos profesionales
 */

'use client'

import { addTitleAction, deleteTitleAction, updateTitleAction } from '@/app/(app)/feed/professional-profile/server/entities.actions'
import { AcademicCapIcon, PencilIcon, TrashIcon } from '@/components/icons/heroicons-shim'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import type { Title, TitleFormData } from '../../interfaces/professional-profile.interfaces'
import { DeleteConfirmDialog } from '../dialogs/DeleteConfirmDialog'
import { TitleDialog } from '../dialogs/TitleDialog'
import { EmptyState, SectionHeader } from './shared'

interface TitlesSectionProps {
  profileId: string
  isOwner: boolean
  items?: Title[]
}

export function TitlesSection({ profileId, isOwner, items = [] }: TitlesSectionProps) {
  const router = useRouter()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null)

  const submit = async (data: TitleFormData) => {
    const result = selectedTitle
      ? await updateTitleAction(profileId, selectedTitle.id, data)
      : await addTitleAction(profileId, data)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(selectedTitle ? 'Título actualizado correctamente' : 'Título agregado correctamente')
    setIsDialogOpen(false)
    router.refresh()
  }

  const handleAdd = () => {
    setSelectedTitle(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (title: Title) => {
    setSelectedTitle(title)
    setIsDialogOpen(true)
  }

  const handleDelete = (title: Title) => {
    setSelectedTitle(title)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedTitle) return
    const result = await deleteTitleAction(profileId, selectedTitle.id)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Título eliminado')
    setIsDeleteDialogOpen(false)
    setSelectedTitle(null)
    router.refresh()
  }

  return (
    <div>
      <SectionHeader
        title="Titulos Profesionales"
        count={items.length}
        onAdd={handleAdd}
        addLabel="Agregar Titulo"
        showAdd={isOwner}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={AcademicCapIcon}
          title="Sin titulos registrados"
          description={
            isOwner
              ? 'Agrega tus titulos academicos y certificaciones para mostrar tu formacion profesional'
              : 'Este usuario aun no ha agregado titulos a su perfil'
          }
          actionLabel={isOwner ? 'Agregar Titulo' : undefined}
          onAction={isOwner ? handleAdd : undefined}
        />
      ) : (
        <div className="space-y-3">
          {items.map((title: Title) => (
            <div
              key={title.id}
              className="group flex items-start justify-between rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800"
            >
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
                  <AcademicCapIcon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-neutral-900 dark:text-white">{title.name}</h3>
                  </div>
                  {title.institution && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{title.institution}</p>
                  )}
                  {title.year && <p className="text-xs text-neutral-500 dark:text-neutral-500">{title.year}</p>}
                </div>
              </div>

              {isOwner && (
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleEdit(title)}
                    className="cursor-pointer rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(title)}
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
      <TitleDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={selectedTitle}
        onSubmit={submit}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Titulo"
        description="¿Estas seguro de que deseas eliminar este titulo? Esta accion no se puede deshacer."
      />
    </div>
  )
}

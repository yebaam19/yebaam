/**
 * StudiesSection Component
 *
 * Sección para mostrar y gestionar los estudios
 */

'use client'

import { addStudyAction, deleteStudyAction, updateStudyAction } from '@/app/(app)/feed/professional-profile/server/entities.actions'
import { BookOpenIcon, PencilIcon, TrashIcon } from '@/components/icons/heroicons-shim'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import type { Study, StudyFormData } from '../../interfaces/professional-profile.interfaces'
import { DeleteConfirmDialog } from '../dialogs/DeleteConfirmDialog'
import { StudyDialog } from '../dialogs/StudyDialog'
import { EmptyState, SectionHeader } from './shared'

interface StudiesSectionProps {
  profileId: string
  isOwner: boolean
  items?: Study[]
}

export function StudiesSection({ profileId, isOwner, items = [] }: StudiesSectionProps) {
  const router = useRouter()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null)

  const submit = async (data: StudyFormData) => {
    const result = selectedStudy
      ? await updateStudyAction(profileId, selectedStudy.id, data)
      : await addStudyAction(profileId, data)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(selectedStudy ? 'Estudio actualizado correctamente' : 'Estudio agregado correctamente')
    setIsDialogOpen(false)
    router.refresh()
  }

  const handleAdd = () => {
    setSelectedStudy(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (study: Study) => {
    setSelectedStudy(study)
    setIsDialogOpen(true)
  }

  const handleDelete = (study: Study) => {
    setSelectedStudy(study)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedStudy) return
    const result = await deleteStudyAction(profileId, selectedStudy.id)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Estudio eliminado')
    setIsDeleteDialogOpen(false)
    setSelectedStudy(null)
    router.refresh()
  }

  return (
    <div>
      <SectionHeader
        title="Estudios"
        count={items.length}
        onAdd={handleAdd}
        addLabel="Agregar Estudio"
        showAdd={isOwner}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={BookOpenIcon}
          title="Sin estudios registrados"
          description={
            isOwner
              ? 'Agrega tus estudios y formacion academica'
              : 'Este usuario aun no ha agregado estudios a su perfil'
          }
          actionLabel={isOwner ? 'Agregar Estudio' : undefined}
          onAction={isOwner ? handleAdd : undefined}
        />
      ) : (
        <div className="space-y-3">
          {items.map((study: Study) => (
            <div
              key={study.id}
              className="group flex items-start justify-between rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800"
            >
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
                  <BookOpenIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">{study.name}</h3>
                  {study.institution && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{study.institution}</p>
                  )}
                  {study.year && <p className="mt-1 text-xs text-neutral-400">{study.year}</p>}
                </div>
              </div>

              {isOwner && (
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleEdit(study)}
                    className="cursor-pointer rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(study)}
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
      <StudyDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        study={selectedStudy}
        onSubmit={submit}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Estudio"
        description="¿Estas seguro de que deseas eliminar este estudio? Esta accion no se puede deshacer."
      />
    </div>
  )
}

/**
 * StudiesSection Component
 *
 * Sección para mostrar y gestionar los estudios
 */

'use client'

import { BookOpenIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { useAddStudy, useDeleteStudy, useUpdateStudy } from '../../hooks'
import type { Study } from '../../interfaces/professional-profile.interfaces'
import { DeleteConfirmDialog } from '../dialogs/DeleteConfirmDialog'
import { StudyDialog } from '../dialogs/StudyDialog'
import { EmptyState, SectionHeader } from './shared'

interface StudiesSectionProps {
  profileId: string
  isOwner: boolean
  items?: Study[]
}

export function StudiesSection({ profileId, isOwner, items = [] }: StudiesSectionProps) {
  const { mutateAsync: addStudy } = useAddStudy()
  const { mutateAsync: updateStudy } = useUpdateStudy()
  const { mutateAsync: deleteStudy } = useDeleteStudy()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null)

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
    if (selectedStudy) {
      await deleteStudy({ profileId, studyId: selectedStudy.id })
      setIsDeleteDialogOpen(false)
      setSelectedStudy(null)
    }
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
        onSubmit={async (data) => {
          if (selectedStudy) {
            await updateStudy({ profileId, studyId: selectedStudy.id, data })
          } else {
            await addStudy({ profileId, data })
          }
          setIsDialogOpen(false)
        }}
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

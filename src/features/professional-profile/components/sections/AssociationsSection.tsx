/**
 * AssociationsSection Component
 *
 * Sección para mostrar y gestionar las asociaciones profesionales
 */

'use client'

import { addAssociationAction, deleteAssociationAction, updateAssociationAction } from '@/app/(app)/feed/professional-profile/server/entities.actions'
import { PencilIcon, TrashIcon, UserGroupIcon } from '@/components/icons/heroicons-shim'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import type { Association, AssociationFormData } from '../../interfaces/professional-profile.interfaces'
import { AssociationDialog } from '../dialogs/AssociationDialog'
import { DeleteConfirmDialog } from '../dialogs/DeleteConfirmDialog'
import { EmptyState, SectionHeader } from './shared'

interface AssociationsSectionProps {
  profileId: string
  isOwner: boolean
  items?: Association[]
}

export function AssociationsSection({ profileId, isOwner, items = [] }: AssociationsSectionProps) {
  const router = useRouter()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAssociation, setSelectedAssociation] = useState<Association | null>(null)

  const submit = async (data: AssociationFormData) => {
    const result = selectedAssociation
      ? await updateAssociationAction(profileId, selectedAssociation.id, data)
      : await addAssociationAction(profileId, data)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(selectedAssociation ? 'Asociación actualizada correctamente' : 'Asociación agregada correctamente')
    setIsDialogOpen(false)
    router.refresh()
  }

  const handleAdd = () => {
    setSelectedAssociation(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (association: Association) => {
    setSelectedAssociation(association)
    setIsDialogOpen(true)
  }

  const handleDelete = (association: Association) => {
    setSelectedAssociation(association)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedAssociation) return
    const result = await deleteAssociationAction(profileId, selectedAssociation.id)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Asociación eliminada')
    setIsDeleteDialogOpen(false)
    setSelectedAssociation(null)
    router.refresh()
  }

  return (
    <div>
      <SectionHeader
        title="Asociaciones Profesionales"
        count={items.length}
        onAdd={handleAdd}
        addLabel="Agregar Asociacion"
        showAdd={isOwner}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={UserGroupIcon}
          title="Sin asociaciones registradas"
          description={
            isOwner
              ? 'Agrega las asociaciones profesionales a las que perteneces'
              : 'Este usuario aun no ha agregado asociaciones a su perfil'
          }
          actionLabel={isOwner ? 'Agregar Asociacion' : undefined}
          onAction={isOwner ? handleAdd : undefined}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((association: Association) => (
            <div
              key={association.id}
              className="group flex items-start justify-between rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800"
            >
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">{association.name}</h3>
                  {association.role && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{association.role}</p>
                  )}
                </div>
              </div>

              {isOwner && (
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleEdit(association)}
                    className="cursor-pointer rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(association)}
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
      <AssociationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        association={selectedAssociation}
        onSubmit={submit}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Asociacion"
        description="¿Estas seguro de que deseas eliminar esta asociacion? Esta accion no se puede deshacer."
      />
    </div>
  )
}

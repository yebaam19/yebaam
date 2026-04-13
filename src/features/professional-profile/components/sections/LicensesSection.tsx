/**
 * LicensesSection Component
 *
 * Sección para mostrar y gestionar las licencias y certificaciones
 */

'use client'

import { DocumentTextIcon, PencilIcon, TrashIcon } from '@/components/icons/heroicons-shim'
import { useState } from 'react'
import { useAddLicense, useUpdateLicense, useDeleteLicense } from '../../hooks'
import type { License } from '../../interfaces/professional-profile.interfaces'
import { DeleteConfirmDialog } from '../dialogs/DeleteConfirmDialog'
import { LicenseDialog } from '../dialogs/LicenseDialog'
import { EmptyState, LoadingState, SectionHeader } from './shared'

interface LicensesSectionProps {
  profileId: string
  isOwner: boolean
  items?: License[]
}

function formatDate(dateValue: string | Date): string {
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue
  return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
}

export function LicensesSection({ profileId, isOwner, items = [] }: LicensesSectionProps) {
  const { mutateAsync: addLicense } = useAddLicense()
  const { mutateAsync: updateLicense } = useUpdateLicense()
  const { mutateAsync: deleteLicense } = useDeleteLicense()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)

  const handleAdd = () => {
    setSelectedLicense(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (license: License) => {
    setSelectedLicense(license)
    setIsDialogOpen(true)
  }

  const handleDelete = (license: License) => {
    setSelectedLicense(license)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (selectedLicense) {
      await deleteLicense({ profileId, licenseId: selectedLicense.id })
      setIsDeleteDialogOpen(false)
      setSelectedLicense(null)
    }
  }

  return (
    <div>
      <SectionHeader
        title="Licencias y Certificaciones"
        count={items.length}
        onAdd={handleAdd}
        addLabel="Agregar Licencia"
        showAdd={isOwner}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={DocumentTextIcon}
          title="Sin licencias registradas"
          description={
            isOwner
              ? 'Agrega tus licencias profesionales y certificaciones'
              : 'Este usuario aun no ha agregado licencias a su perfil'
          }
          actionLabel={isOwner ? 'Agregar Licencia' : undefined}
          onAction={isOwner ? handleAdd : undefined}
        />
      ) : (
        <div className="space-y-3">
          {items.map((license: License) => (
            <div
              key={license.id}
              className="group flex items-start justify-between rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800"
            >
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                  <DocumentTextIcon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-neutral-900 dark:text-white">{license.name}</h3>
                  </div>
                  {license.issuedBy && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{license.issuedBy}</p>
                  )}
                  {license.number && <p className="text-xs text-neutral-500">No. de Licencia: {license.number}</p>}
                  {license.issuedAt && (
                    <p className="mt-1 text-xs text-neutral-500">Emitida: {formatDate(license.issuedAt)}</p>
                  )}
                </div>
              </div>

              {isOwner && (
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleEdit(license)}
                    className="cursor-pointer rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(license)}
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
      <LicenseDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        license={selectedLicense}
        onSubmit={async (data) => {
          if (selectedLicense) {
            await updateLicense({ profileId, licenseId: selectedLicense.id, data })
          } else {
            await addLicense({ profileId, data })
          }
          setIsDialogOpen(false)
        }}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Licencia"
        description="¿Estas seguro de que deseas eliminar esta licencia? Esta accion no se puede deshacer."
      />
    </div>
  )
}

/**
 * TitlesSection Component
 *
 * Sección para mostrar y gestionar los títulos profesionales
 */

'use client'

import { addTitleAction, deleteTitleAction, updateTitleAction } from '@/app/(app)/feed/professional-profile/server/entities.actions'
import { AcademicCapIcon, CheckBadgeIcon, PencilIcon, ShieldCheckIcon, TrashIcon } from '@/components/icons/heroicons-shim'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { Title, TitleFormData } from '../../interfaces/professional-profile.interfaces'
import { DeleteConfirmDialog } from '../dialogs/DeleteConfirmDialog'
import { TitleDialog } from '../dialogs/TitleDialog'
import { CredentialUploadDialog } from '../dialogs/CredentialUploadDialog'
import { composeTitleLine } from '../../lib/credentials'
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
  const [credentialDialogTitle, setCredentialDialogTitle] = useState<Title | null>(null)
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null)

  const existingFocuses = useMemo(() => {
    const set = new Set<string>()
    for (const t of items) for (const f of t.focuses ?? []) set.add(f)
    return Array.from(set).sort()
  }, [items])

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
          {items.map((title: Title) => {
            const status = title.credentialStatus
            const verified = status === 'approved'
            const composed = composeTitleLine(title)
            return (
              <div
                key={title.id}
                className="group flex items-start justify-between rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800"
              >
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
                    <AcademicCapIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-neutral-900 dark:text-white">{composed}</h3>
                      {verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          <CheckBadgeIcon className="h-3.5 w-3.5" />
                          Verificado
                        </span>
                      )}
                      {isOwner && status === 'pending' && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          Pendiente de verificación
                        </span>
                      )}
                      {isOwner && status === 'review_needed' && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          Revisión por edición
                        </span>
                      )}
                      {isOwner && status === 'rejected' && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
                          Verificación rechazada
                        </span>
                      )}
                    </div>
                    {title.focuses && title.focuses.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {title.focuses.map((f) => (
                          <span
                            key={f}
                            className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {isOwner && (
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setCredentialDialogTitle(title)}
                      className="cursor-pointer rounded-lg p-2 text-neutral-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400"
                      title={status === 'approved' ? 'Verificado' : 'Autenticar'}
                    >
                      <ShieldCheckIcon className="h-4 w-4" />
                    </button>
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
            )
          })}
        </div>
      )}

      {/* Dialogs */}
      <TitleDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={selectedTitle}
        existingFocuses={existingFocuses}
        onSubmit={submit}
      />

      {credentialDialogTitle && (
        <CredentialUploadDialog
          isOpen={!!credentialDialogTitle}
          onClose={() => setCredentialDialogTitle(null)}
          profileId={profileId}
          target="title"
          targetId={credentialDialogTitle.id}
          currentStatus={credentialDialogTitle.credentialStatus}
          currentRequestId={credentialDialogTitle.credentialRequestId ?? null}
          verifiedAt={credentialDialogTitle.verifiedAt ?? null}
        />
      )}

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

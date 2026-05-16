/**
 * StudiesSection Component
 *
 * Sección para mostrar y gestionar los estudios
 */

'use client'

import { addStudyAction, deleteStudyAction, updateStudyAction } from '@/app/(app)/feed/professional-profile/server/entities.actions'
import { BookOpenIcon, CheckBadgeIcon, PencilIcon, ShieldCheckIcon, TrashIcon } from '@/components/icons/heroicons-shim'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import type { Study, StudyFormData } from '../../interfaces/professional-profile.interfaces'
import { DeleteConfirmDialog } from '../dialogs/DeleteConfirmDialog'
import { StudyDialog } from '../dialogs/StudyDialog'
import { CredentialUploadDialog } from '../dialogs/CredentialUploadDialog'
import { composeStudyLine } from '../../lib/credentials'
import { EmptyState, SectionHeader } from './shared'

interface StudiesSectionProps {
  profileId: string
  isOwner: boolean
  items?: Study[]
}

export function StudiesSection({ profileId, isOwner, items = [] }: StudiesSectionProps) {
  const router = useRouter()
  const t = useTranslations('professional.sections')

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null)
  const [credentialDialogStudy, setCredentialDialogStudy] = useState<Study | null>(null)

  const submit = async (data: StudyFormData) => {
    const result = selectedStudy
      ? await updateStudyAction(profileId, selectedStudy.id, data)
      : await addStudyAction(profileId, data)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(selectedStudy ? t('studies.toastUpdated') : t('studies.toastAdded'))
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
    toast.success(t('studies.toastDeleted'))
    setIsDeleteDialogOpen(false)
    setSelectedStudy(null)
    router.refresh()
  }

  return (
    <div>
      <SectionHeader
        title={t('studies.heading')}
        count={items.length}
        onAdd={handleAdd}
        addLabel={t('studies.addButton')}
        showAdd={isOwner}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={BookOpenIcon}
          title={t('studies.emptyTitle')}
          description={
            isOwner
              ? t('studies.emptyDescriptionOwner')
              : t('studies.emptyDescriptionOther')
          }
          actionLabel={isOwner ? t('studies.addButton') : undefined}
          onAction={isOwner ? handleAdd : undefined}
        />
      ) : (
        <div className="space-y-3">
          {items.map((study: Study) => {
            const status = study.credentialStatus
            const verified = status === 'approved'
            const composed = composeStudyLine(study)
            return (
              <div
                key={study.id}
                className="group flex items-start justify-between rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800"
              >
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
                    <BookOpenIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-neutral-900 dark:text-white">{composed}</h3>
                      {verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          <CheckBadgeIcon className="h-3.5 w-3.5" />
                          {t('common.verified')}
                        </span>
                      )}
                      {isOwner && status === 'pending' && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {t('common.pending')}
                        </span>
                      )}
                      {isOwner && status === 'review_needed' && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          {t('common.reviewNeeded')}
                        </span>
                      )}
                      {isOwner && status === 'rejected' && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
                          {t('common.rejected')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isOwner && (
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setCredentialDialogStudy(study)}
                      className="cursor-pointer rounded-lg p-2 text-neutral-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400"
                      title={status === 'approved' ? t('common.verified') : t('common.authenticate')}
                    >
                      <ShieldCheckIcon className="h-4 w-4" />
                    </button>
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
            )
          })}
        </div>
      )}

      {/* Dialogs */}
      <StudyDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        study={selectedStudy}
        onSubmit={submit}
      />

      {credentialDialogStudy && (
        <CredentialUploadDialog
          isOpen={!!credentialDialogStudy}
          onClose={() => setCredentialDialogStudy(null)}
          profileId={profileId}
          target="study"
          targetId={credentialDialogStudy.id}
          currentStatus={credentialDialogStudy.credentialStatus}
          currentRequestId={credentialDialogStudy.credentialRequestId ?? null}
          verifiedAt={credentialDialogStudy.verifiedAt ?? null}
        />
      )}

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={t('studies.deleteTitle')}
        description={t('studies.deleteDescription')}
      />
    </div>
  )
}

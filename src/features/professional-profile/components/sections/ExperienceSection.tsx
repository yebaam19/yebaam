/**
 * ExperienceSection Component
 *
 * Sección para mostrar y gestionar la experiencia laboral
 */

'use client'

import { addExperienceAction, deleteExperienceAction, updateExperienceAction } from '@/app/(app)/feed/professional-profile/server/entities.actions'
import { BriefcaseIcon, PencilIcon, TrashIcon } from '@/components/icons/heroicons-shim'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import type { Experience, ExperienceFormData } from '../../interfaces/professional-profile.interfaces'
import { DeleteConfirmDialog } from '../dialogs/DeleteConfirmDialog'
import { ExperienceDialog } from '../dialogs/ExperienceDialog'
import { EmptyState, SectionHeader } from './shared'

interface ExperienceSectionProps {
  profileId: string
  isOwner: boolean
  items?: Experience[]
}

function formatDate(dateValue: string | Date, locale: string): string {
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue
  const intlLocale = locale === 'en' ? 'en-US' : 'es-ES'
  return date.toLocaleDateString(intlLocale, { month: 'short', year: 'numeric' })
}

export function ExperienceSection({ profileId, isOwner, items = [] }: ExperienceSectionProps) {
  const router = useRouter()
  const t = useTranslations('professional.sections')
  const locale = useLocale()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null)

  const submit = async (data: ExperienceFormData) => {
    const result = selectedExperience
      ? await updateExperienceAction(profileId, selectedExperience.id, data)
      : await addExperienceAction(profileId, data)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(selectedExperience ? t('experience.toastUpdated') : t('experience.toastAdded'))
    setIsDialogOpen(false)
    router.refresh()
  }

  const handleAdd = () => {
    setSelectedExperience(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (exp: Experience) => {
    setSelectedExperience(exp)
    setIsDialogOpen(true)
  }

  const handleDelete = (exp: Experience) => {
    setSelectedExperience(exp)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedExperience) return
    const result = await deleteExperienceAction(profileId, selectedExperience.id)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(t('experience.toastDeleted'))
    setIsDeleteDialogOpen(false)
    setSelectedExperience(null)
    router.refresh()
  }

  return (
    <div>
      <SectionHeader
        title={t('experience.heading')}
        count={items.length}
        onAdd={handleAdd}
        addLabel={t('experience.addButton')}
        showAdd={isOwner}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={BriefcaseIcon}
          title={t('experience.emptyTitle')}
          description={
            isOwner
              ? t('experience.emptyDescriptionOwner')
              : t('experience.emptyDescriptionOther')
          }
          actionLabel={isOwner ? t('experience.addButton') : undefined}
          onAction={isOwner ? handleAdd : undefined}
        />
      ) : (
        <div className="space-y-3">
          {items.map((exp: Experience) => (
            <div
              key={exp.id}
              className="group flex items-start justify-between rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800"
            >
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                  <BriefcaseIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">{exp.position}</h3>
                  {exp.company && <p className="text-sm text-neutral-600 dark:text-neutral-400">{exp.company}</p>}
                  {exp.startDate && (
                    <p className="mt-1 text-xs text-neutral-500">
                      {formatDate(exp.startDate, locale)} - {exp.endDate ? formatDate(exp.endDate, locale) : t('common.present')}
                    </p>
                  )}
                  {exp.description && (
                    <p className="mt-2 whitespace-pre-line text-sm text-neutral-600 dark:text-neutral-400">{exp.description}</p>
                  )}
                </div>
              </div>

              {isOwner && (
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleEdit(exp)}
                    className="cursor-pointer rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(exp)}
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
      <ExperienceDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        experience={selectedExperience}
        onSubmit={submit}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={t('experience.deleteTitle')}
        description={t('experience.deleteDescription')}
      />
    </div>
  )
}

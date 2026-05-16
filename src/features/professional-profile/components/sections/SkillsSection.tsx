/**
 * SkillsSection Component
 *
 * Sección para mostrar y gestionar las habilidades
 */

'use client'

import { addSkillAction, deleteSkillAction, updateSkillAction } from '@/app/(app)/feed/professional-profile/server/entities.actions'
import { cn } from '@/lib/utils'
import { LightBulbIcon, PencilIcon, TrashIcon } from '@/components/icons/heroicons-shim'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import type { Skill, SkillFormData } from '../../interfaces/professional-profile.interfaces'
import { DeleteConfirmDialog } from '../dialogs/DeleteConfirmDialog'
import { SkillDialog } from '../dialogs/SkillDialog'
import { EmptyState, SectionHeader } from './shared'

interface SkillsSectionProps {
  profileId: string
  isOwner: boolean
  items?: Skill[]
}

// Colores para diferentes niveles (string)
const getLevelColor = (level?: string | null): string => {
  if (!level) return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
  const lowerLevel = level.toLowerCase()
  if (lowerLevel.includes('principiante') || lowerLevel.includes('beginner')) {
    return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
  }
  if (lowerLevel.includes('intermedio') || lowerLevel.includes('intermediate')) {
    return 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
  }
  if (lowerLevel.includes('avanzado') || lowerLevel.includes('advanced')) {
    return 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400'
  }
  if (lowerLevel.includes('experto') || lowerLevel.includes('expert')) {
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  }
  return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
}

export function SkillsSection({ profileId, isOwner, items = [] }: SkillsSectionProps) {
  const router = useRouter()
  const t = useTranslations('professional.sections')

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)

  const submit = async (data: SkillFormData) => {
    const result = selectedSkill
      ? await updateSkillAction(profileId, selectedSkill.id, data)
      : await addSkillAction(profileId, data)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(selectedSkill ? t('skills.toastUpdated') : t('skills.toastAdded'))
    setIsDialogOpen(false)
    router.refresh()
  }

  const handleAdd = () => {
    setSelectedSkill(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (skill: Skill) => {
    setSelectedSkill(skill)
    setIsDialogOpen(true)
  }

  const handleDelete = (skill: Skill) => {
    setSelectedSkill(skill)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedSkill) return
    const result = await deleteSkillAction(profileId, selectedSkill.id)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(t('skills.toastDeleted'))
    setIsDeleteDialogOpen(false)
    setSelectedSkill(null)
    router.refresh()
  }

  return (
    <div>
      <SectionHeader
        title={t('skills.heading')}
        count={items.length}
        onAdd={handleAdd}
        addLabel={t('skills.addButton')}
        showAdd={isOwner}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={LightBulbIcon}
          title={t('skills.emptyTitle')}
          description={
            isOwner
              ? t('skills.emptyDescriptionOwner')
              : t('skills.emptyDescriptionOther')
          }
          actionLabel={isOwner ? t('skills.addButton') : undefined}
          onAction={isOwner ? handleAdd : undefined}
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((skill: Skill) => (
            <div
              key={skill.id}
              className="group relative flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800"
            >
              <span className="font-medium text-neutral-900 dark:text-white">{skill.name}</span>
              {skill.level && (
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', getLevelColor(skill.level))}>
                  {skill.level}
                </span>
              )}

              {isOwner && (
                <div className="ml-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleEdit(skill)}
                    className="cursor-pointer rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                  >
                    <PencilIcon className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(skill)}
                    className="cursor-pointer rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <SkillDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        skill={selectedSkill}
        onSubmit={submit}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={t('skills.deleteTitle')}
        description={t('skills.deleteDescription')}
      />
    </div>
  )
}

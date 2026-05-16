'use client'

/**
 * EditWorkEducationDialog
 *
 * Modal para editar lugar de trabajo, lugar de estudios y los idiomas que
 * habla el usuario. Los idiomas se guardan como `text[]` en `profiles.languages`.
 */

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { UserProfile } from '../../interfaces/profile.interfaces'
import { useProfileStore } from '../../store/profile.store'
import BaseDialog from './BaseDialog'
import Input from '@/ui/Input'
import TagInputRow from './TagInputRow'

interface EditWorkEducationDialogProps {
  user: UserProfile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EditWorkEducationDialog({
  user,
  open,
  onOpenChange,
}: EditWorkEducationDialogProps) {
  const t = useTranslations('profile.dialogs.editWorkEducation')
  const tc = useTranslations('profile.dialogs.common')
  const [workPlace, setWorkPlace] = useState(user.workPlace || '')
  const [studyPlace, setStudyPlace] = useState(user.studyPlace || '')
  const [languages, setLanguages] = useState<string[]>(user.languages ?? [])

  const { updateProfile, isLoading } = useProfileStore()

  useEffect(() => {
    if (open) {
      setWorkPlace(user.workPlace || '')
      setStudyPlace(user.studyPlace || '')
      setLanguages(user.languages ?? [])
    }
  }, [open, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateProfile({ workPlace, studyPlace, languages })
      onOpenChange(false)
    } catch (error) {
      console.error('Error al guardar trabajo/educación:', error)
    }
  }

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('title')}
      description={t('description')}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submitLabel={tc('save')}
      cancelLabel={tc('cancel')}
    >
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">{t('workPlaceLabel')}</label>
          <Input
            value={workPlace}
            onChange={(e) => setWorkPlace(e.target.value)}
            placeholder={t('workPlacePlaceholder')}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {t('workPlaceHelper')}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t('studyPlaceLabel')}</label>
          <Input
            value={studyPlace}
            onChange={(e) => setStudyPlace(e.target.value)}
            placeholder={t('studyPlacePlaceholder')}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {t('studyPlaceHelper')}
          </p>
        </div>

        <TagInputRow
          label={t('languagesLabel')}
          helper={t('languagesHelper')}
          placeholder={t('languagesPlaceholder')}
          value={languages}
          onChange={setLanguages}
          max={15}
        />
      </div>
    </BaseDialog>
  )
}

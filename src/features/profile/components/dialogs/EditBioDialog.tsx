/**
 * EditBioDialog Component
 *
 * Modal para editar la biografía del usuario
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { UserProfile } from '../../interfaces/profile.interfaces'
import { useProfileStore } from '../../store/profile.store'
import BaseDialog from './BaseDialog'

interface EditBioDialogProps {
  user: UserProfile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EditBioDialog({ user, open, onOpenChange }: EditBioDialogProps) {
  const t = useTranslations('profile.dialogs.editBio')
  const [bio, setBio] = useState(user.bio || '')
  const { updateProfile, isLoading } = useProfileStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateProfile({ bio })
      onOpenChange(false)
    } catch (error) {
      // Error ya manejado por el store
      console.error('Error al guardar biografía:', error)
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
    >
      <div>
        <label htmlFor="bio" className="block text-sm font-medium mb-2">
          {t('bioLabel')}
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={t('bioPlaceholder')}
          rows={6}
          maxLength={500}
          className="block w-full rounded-2xl border-neutral-200 bg-white focus:border-primary-300 focus:ring-3 focus:ring-primary-200/50 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-600/25 px-4 py-3 text-sm font-normal resize-none"
        />
        <p className="mt-2 text-xs text-muted-foreground text-right">
          {t('bioCounter', { count: bio.length })}
        </p>
      </div>
    </BaseDialog>
  )
}

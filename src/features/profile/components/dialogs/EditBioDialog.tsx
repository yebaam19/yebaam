/**
 * EditBioDialog Component
 * 
 * Modal para editar la biografía del usuario
 */

import { useState } from 'react'
import type { UserProfile } from '../../interfaces/profile.interfaces'
import { useProfileStore } from '../../store/profile.store'
import BaseDialog from './BaseDialog'

interface EditBioDialogProps {
  user: UserProfile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EditBioDialog({ user, open, onOpenChange }: EditBioDialogProps) {
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
      title="Editar biografía"
      description="Cuéntale a las personas más sobre ti"
      onSubmit={handleSubmit}
      isLoading={isLoading}
    >
      <div>
        <label htmlFor="bio" className="block text-sm font-medium mb-2">
          Biografía
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Escribe algo sobre ti..."
          rows={6}
          maxLength={500}
          className="block w-full rounded-2xl border-neutral-200 bg-white focus:border-primary-300 focus:ring-3 focus:ring-primary-200/50 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-primary-600/25 px-4 py-3 text-sm font-normal resize-none"
        />
        <p className="mt-2 text-xs text-muted-foreground text-right">
          {bio.length}/500 caracteres
        </p>
      </div>
    </BaseDialog>
  )
}

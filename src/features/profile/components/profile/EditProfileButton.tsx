'use client'

/**
 * EditProfileButton Component
 *
 * Botón para abrir el diálogo de edición de perfil
 */

import { PencilSquareIcon } from '@/components/icons/heroicons-shim'
import { useState } from 'react'
import type { UserProfile } from '../../interfaces/profile.interfaces'
import EditProfileDialog from '../dialogs/EditProfileDialog'

interface EditProfileButtonProps {
  user: UserProfile
}

export default function EditProfileButton({ user }: EditProfileButtonProps) {
  const [showDialog, setShowDialog] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
      >
        <PencilSquareIcon className="h-5 w-5" />
        <span>Editar perfil</span>
      </button>

      <EditProfileDialog user={user} open={showDialog} onOpenChange={setShowDialog} />
    </>
  )
}

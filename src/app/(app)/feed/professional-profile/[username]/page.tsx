'use client'

import { EditProfileDialog } from '@/features/professional-profile/components/dialogs'
import type { EditProfileFormData } from '@/features/professional-profile/components/dialogs/EditProfileDialog'
import { ContentTabs } from '@/features/professional-profile/components/profile/ContentTabs'
import { ProfileHeader } from '@/features/professional-profile/components/profile/ProfileHeader'
import { ArrowLeftIcon, ArrowPathIcon } from '@/components/icons/heroicons-shim'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { useMyProfile, useProfileByUsername } from '@/features/professional-profile/hooks'
import { useUpdateProfile } from '@/features/professional-profile/hooks/mutations/useProfessionalProfileMutations'

export default function ProfessionalProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const { data: currentProfile, isLoading, error, isFetching } = useProfileByUsername(username)
  const { data: myProfile } = useMyProfile()
  const isOwner = myProfile?.userId === currentProfile?.userId

  // State para el diálogo de edición
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Mutation para actualizar perfil
  const updateProfileMutation = useUpdateProfile()

  const userData = useMemo(() => {
    if (currentProfile?.user) {
      return currentProfile.user
    }
    // Fallback user data
    return {
      id: currentProfile?.userId || username,
      firstName: 'Usuario',
      lastName: 'Profesional',
      username: username,
      avatar: null,
    }
  }, [currentProfile, username])

  // Handlers
  const handleEditProfile = () => {
    setIsEditDialogOpen(true)
  }

  const handleUpdateProfile = async (data: EditProfileFormData) => {
    if (!currentProfile) return

    try {
      await updateProfileMutation.mutateAsync({
        profileId: currentProfile.id,
        data,
      })
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('[ProfessionalProfilePage] Error updating profile:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-3 text-neutral-600 dark:text-neutral-400">Cargando perfil profesional...</span>
      </div>
    )
  }

  if (error || !currentProfile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="mx-auto max-w-md text-center">
          <div className="mb-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <ArrowPathIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">Perfil no encontrado</h2>
          <p className="mb-6 text-neutral-600 dark:text-neutral-400">
            {error?.message || 'El perfil profesional que buscas no existe o no está disponible.'}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Volver
            </button>
            <Link
              href="/feed"
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
            >
              Ir al Feed
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="mx-auto max-w-5xl p-5">
        {/* Back button */}
        <div className="mb-5">
          <button
            onClick={() => router.push('/feed')}
            className="inline-flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Volver
          </button>
        </div>

        {/* Profile Header */}
        <div className="mb-5">
          <ProfileHeader profile={currentProfile} user={userData} isOwner={isOwner} onEditProfile={handleEditProfile} />
        </div>

        {/* Content Tabs */}
        <ContentTabs profile={currentProfile} isOwner={isOwner} isRefetching={isFetching} />
      </div>

      {/* Edit Profile Dialog */}
      {isOwner && (
        <EditProfileDialog
          isOpen={isEditDialogOpen}
          profile={currentProfile}
          onClose={() => setIsEditDialogOpen(false)}
          onSubmit={handleUpdateProfile}
        />
      )}
    </div>
  )
}

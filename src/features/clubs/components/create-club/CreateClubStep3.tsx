import { PhotoIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import { FC, useState } from 'react'
import { useUploadClubImage } from '../../hooks/useClubs'
import type { CreateClubDto } from '../../types/club.types'

interface CreateClubStep3Props {
  data: Partial<CreateClubDto>
  onUpdate: (data: Partial<CreateClubDto>) => void
  onNext: () => void
  onBack: () => void
}

export const CreateClubStep3: FC<CreateClubStep3Props> = ({ data, onUpdate, onNext, onBack }) => {
  const [profileImageUrl, setProfileImageUrl] = useState<string>(data.profileImage ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState<string>(data.coverImage ?? '')

  const uploadProfileImage = useUploadClubImage('profile')
  const uploadCoverImage = useUploadClubImage('cover')

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await uploadProfileImage.mutateAsync(file)
      setProfileImageUrl(result.fileUrl)
    } catch (error) {
      console.error('Error uploading profile image:', error)
    }
  }

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await uploadCoverImage.mutateAsync(file)
      setCoverImageUrl(result.fileUrl)
    } catch (error) {
      console.error('Error uploading cover image:', error)
    }
  }

  const handleNext = () => {
    onUpdate({
      profileImage: profileImageUrl || undefined,
      coverImage: coverImageUrl || undefined,
    })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Imágenes del club</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">Añade imágenes para personalizar tu club (opcional)</p>
      </div>

      {/* Profile Image */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Imagen de perfil <span className="text-xs text-gray-400">(opcional)</span>
        </label>
        <div className="flex items-center gap-4">
          {profileImageUrl ? (
            <div className="relative h-24 w-24 overflow-hidden rounded-full">
              <Image src={profileImageUrl} alt="Profile preview" fill className="object-cover" />
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <PhotoIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <div className="flex-1">
            <input
              type="file"
              id="profile-image"
              accept="image/*"
              onChange={handleProfileImageUpload}
              className="hidden"
              disabled={uploadProfileImage.isPending}
            />
            <label
              htmlFor="profile-image"
              className="inline-flex cursor-pointer items-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
            >
              {uploadProfileImage.isPending ? 'Subiendo...' : 'Subir imagen'}
            </label>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Recomendado: 400x400px, máx. 5MB</p>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Imagen de portada <span className="text-xs text-gray-400">(opcional)</span>
        </label>
        <div className="space-y-3">
          {coverImageUrl ? (
            <div className="relative h-48 w-full overflow-hidden rounded-lg">
              <Image src={coverImageUrl} alt="Cover preview" fill className="object-cover" />
            </div>
          ) : (
            <div className="flex h-48 w-full items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
              <PhotoIcon className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <div>
            <input
              type="file"
              id="cover-image"
              accept="image/*"
              onChange={handleCoverImageUpload}
              className="hidden"
              disabled={uploadCoverImage.isPending}
            />
            <label
              htmlFor="cover-image"
              className="inline-flex cursor-pointer items-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
            >
              {uploadCoverImage.isPending ? 'Subiendo...' : 'Subir imagen'}
            </label>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Recomendado: 1200x400px, máx. 5MB</p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="rounded-lg border border-neutral-300 px-6 py-2.5 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:outline-none dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          Atrás
        </button>
        <button
          onClick={handleNext}
          disabled={uploadProfileImage.isPending || uploadCoverImage.isPending}
          className="rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}

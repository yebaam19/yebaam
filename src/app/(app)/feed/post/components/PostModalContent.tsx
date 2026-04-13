'use client'

import { XMarkIcon } from '@/components/icons/heroicons-shim'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { PostFeeling, PostLocation, PostGif } from '../interfaces/post.interfaces'
import type { CreatePostInput } from '../validators/create-post.validator'

import FilePreviews from './FilePreviews'
import PostContentTextarea from './PostContentTextarea'
import PostUserInfo from './PostUserInfo'

interface PostModalContentProps {
  // User
  userAvatar: string
  userName: string
  // Form
  register: UseFormRegister<CreatePostInput>
  errors: FieldErrors<CreatePostInput>
  // Files
  selectedFiles: File[]
  previewUrls: string[]
  onRemoveFile: (index: number) => void
  // Customization
  selectedVisibility: 'public' | 'friends' | 'private'
  onVisibilityChange: (visibility: 'public' | 'friends' | 'private') => void
  backgroundColor?: string
  selectedFeeling: PostFeeling | null
  onRemoveFeeling: () => void
  selectedLocation: PostLocation | null
  onRemoveLocation: () => void
  selectedGif: PostGif | null
  onRemoveGif: () => void
  isDisabled: boolean
}

export default function PostModalContent({
  userAvatar,
  userName,
  register,
  errors,
  selectedFiles,
  previewUrls,
  onRemoveFile,
  selectedVisibility,
  onVisibilityChange,
  backgroundColor,
  selectedFeeling,
  onRemoveFeeling,
  selectedLocation,
  onRemoveLocation,
  selectedGif,
  onRemoveGif,
  isDisabled,
}: PostModalContentProps) {
  return (
    <div className="space-y-4 p-6">
      {/* User Info */}
      <PostUserInfo
        userAvatar={userAvatar}
        userName={userName}
        selectedVisibility={selectedVisibility}
        onVisibilityChange={onVisibilityChange}
      />

      {/* Content Textarea */}
      <PostContentTextarea
        register={register}
        errors={errors}
        userName={userName}
        backgroundColor={backgroundColor}
        hasFiles={selectedFiles.length > 0}
        isDisabled={isDisabled}
      />

      {/* Selected Feeling/Activity */}
      {selectedFeeling && (
        <div className="flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-2 dark:bg-neutral-800">
          <span className="text-lg">{selectedFeeling.emoji}</span>
          <span className="text-sm text-neutral-700 dark:text-neutral-300">
            {selectedFeeling.prefix} <span className="font-semibold">{selectedFeeling.label}</span>
          </span>
          <button
            type="button"
            onClick={onRemoveFeeling}
            className="ml-auto text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Selected Location */}
      {selectedLocation && (
        <div className="flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-2 dark:bg-neutral-800">
          <span className="h-5 w-5 text-red-600">📍</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">{selectedLocation.name}</p>
            {selectedLocation.address && <p className="text-xs text-neutral-500">{selectedLocation.address}</p>}
          </div>
          <button
            type="button"
            onClick={onRemoveLocation}
            className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Selected GIF */}
      {selectedGif && (
        <div className="relative overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
          <img src={selectedGif.url} alt={selectedGif.title} className="h-auto w-full" />
          <button
            type="button"
            onClick={onRemoveGif}
            className="absolute top-2 right-2 rounded-full bg-neutral-900/80 p-1.5 text-white hover:bg-neutral-900"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* File Previews */}
      {previewUrls.length > 0 && (
        <FilePreviews previewUrls={previewUrls} selectedFiles={selectedFiles} onRemove={onRemoveFile} />
      )}
    </div>
  )
}

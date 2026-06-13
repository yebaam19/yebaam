'use client'

import { BlogImageUploader } from '../BlogImageUploader'

interface BlogImagesSectionProps {
  avatarLabel: string
  coverLabel: string
  avatarPreview: string | null
  coverPreview: string | null
  avatarFile: File | null
  coverFile: File | null
  onAvatarChange: (file: File | null) => void
  onCoverChange: (file: File | null) => void
  onAvatarRemove: () => void
  onCoverRemove: () => void
  disabled?: boolean
  uploadingImages: boolean
  uploadingHint: string
}

export const BlogImagesSection = ({
  avatarLabel,
  coverLabel,
  avatarPreview,
  coverPreview,
  avatarFile,
  coverFile,
  onAvatarChange,
  onCoverChange,
  onAvatarRemove,
  onCoverRemove,
  disabled = false,
  uploadingImages,
  uploadingHint,
}: BlogImagesSectionProps) => {
  return (
    <>
      {/* Imágenes */}
      <div className="grid grid-cols-2 gap-4">
        <BlogImageUploader
          label={avatarLabel}
          preview={avatarPreview}
          file={avatarFile}
          onFileChange={onAvatarChange}
          onRemove={onAvatarRemove}
          disabled={disabled}
          type="avatar"
        />

        <BlogImageUploader
          label={coverLabel}
          preview={coverPreview}
          file={coverFile}
          onFileChange={onCoverChange}
          onRemove={onCoverRemove}
          disabled={disabled}
          type="cover"
        />
      </div>

      {uploadingImages && (
        <div className="text-center text-sm text-primary-600 dark:text-primary-400">
          ⏳ {uploadingHint}
        </div>
      )}
    </>
  )
}

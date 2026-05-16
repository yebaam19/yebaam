'use client'

import { useTranslations } from 'next-intl'
import PostUploadProgress from './PostUploadProgress'

interface PostModalFooterProps {
  isUploading: boolean
  isCreating: boolean
  uploadProgress: number
  hasContent: boolean
  onSubmit: () => void
}

export default function PostModalFooter({
  isUploading,
  isCreating,
  uploadProgress,
  hasContent,
  onSubmit,
}: PostModalFooterProps) {
  const t = useTranslations('feed')
  return (
    <div className="border-t border-neutral-200 px-6 py-4 dark:border-neutral-800">
      {isUploading && <PostUploadProgress progress={uploadProgress} />}

      <button
        type="submit"
        onClick={onSubmit}
        disabled={isCreating || isUploading || !hasContent}
        className="w-full rounded-lg bg-primary-600 py-2.5 font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isUploading ? t('composer.uploading') : isCreating ? t('composer.submitting') : t('composer.submit')}
      </button>
    </div>
  )
}

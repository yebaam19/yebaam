'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'

interface BlogImageUploaderProps {
  label: string
  preview: string | null
  file: File | null
  onFileChange: (file: File | null) => void
  onRemove: () => void
  disabled?: boolean
  type?: 'avatar' | 'cover'
}

export const BlogImageUploader = ({
  label,
  preview,
  file,
  onFileChange,
  onRemove,
  disabled = false,
  type = 'cover',
}: BlogImageUploaderProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onFileChange(selectedFile)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const isAvatar = type === 'avatar'
  const heightClass = isAvatar ? 'h-32' : 'h-24'
  const containerClass = isAvatar ? 'flex-col items-center' : 'flex-col items-center'

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>
      <div className={`flex ${containerClass}`}>
        {preview ? (
          <div className={`relative w-full ${heightClass} mb-2`}>
            <img
              src={preview}
              alt={`${label} preview`}
              className={`h-full w-full rounded-lg object-cover ${isAvatar ? 'rounded-full' : ''}`}
            />
            {file && (
              <button
                type="button"
                onClick={onRemove}
                disabled={disabled}
                className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 disabled:opacity-50"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div
            className={`w-full ${heightClass} mb-2 flex items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600`}
          >
            <span className="text-xs text-neutral-400">{isAvatar ? 'Sin avatar' : 'Sin portada'}</span>
          </div>
        )}
        <label className="cursor-pointer">
          <span className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">
            {preview ? 'Cambiar imagen' : 'Seleccionar imagen'}
          </span>
          <input type="file" accept="image/*" onChange={handleFileChange} disabled={disabled} className="hidden" />
        </label>
      </div>
    </div>
  )
}

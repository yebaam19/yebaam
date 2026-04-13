'use client'

import { PhotoIcon, UserGroupIcon, MapPinIcon, GifIcon } from '@/components/icons/heroicons-shim'
import type { ChangeEvent } from 'react'
import type { PostFeeling } from '../interfaces/post.interfaces'
import PostColorPicker from './PostColorPicker'
import PostFeelingPicker from './PostFeelingPicker'

interface PostActionsBarProps {
  // File input
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void
  // Color picker
  backgroundColor?: string
  showColorPicker: boolean
  onToggleColorPicker: () => void
  onColorChange: (color: string | undefined) => void
  // Feeling picker
  onSelectFeeling: (feeling: PostFeeling) => void
  // State
  isDisabled: boolean
  hasFiles: boolean
  hasGif: boolean
}

export default function PostActionsBar({
  fileInputRef,
  onFileSelect,
  backgroundColor,
  showColorPicker,
  onToggleColorPicker,
  onColorChange,
  onSelectFeeling,
  isDisabled,
  hasFiles,
  hasGif,
}: PostActionsBarProps) {
  const showColorPickerSection = !hasFiles && !hasGif

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800">
      {/* Color Picker */}
      {showColorPickerSection && (
        <PostColorPicker
          backgroundColor={backgroundColor}
          showColorPicker={showColorPicker}
          onTogglePicker={onToggleColorPicker}
          onColorChange={onColorChange}
          isDisabled={isDisabled}
        />
      )}

      {/* Action Buttons */}
      <div className="p-3">
        <p className="mb-2 text-sm font-semibold text-neutral-900 dark:text-white">Agregar a tu publicación</p>
        <div className="flex items-center gap-1">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska,video/mpeg,video/x-m4v"
            multiple
            onChange={onFileSelect}
            className="hidden"
            disabled={isDisabled}
          />

          {/* Photo/Video button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled || !!backgroundColor}
            className="rounded-full p-2 hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
            title={backgroundColor ? 'No disponible con color de fondo' : 'Foto/Video'}
          >
            <PhotoIcon className="h-6 w-6 text-green-600" />
          </button>

          {/* Feeling button */}
          <PostFeelingPicker onSelectFeeling={onSelectFeeling} isDisabled={isDisabled} />

          {/* Tagged users button (disabled) */}
          <button
            type="button"
            disabled={true}
            className="rounded-full p-2 hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
            title="Etiquetar personas (Próximamente)"
          >
            <UserGroupIcon className="h-6 w-6 text-blue-600" />
          </button>

          {/* Location button (disabled) */}
          <button
            type="button"
            disabled={true}
            className="rounded-full p-2 hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
            title="Ubicación (Próximamente)"
          >
            <MapPinIcon className="h-6 w-6 text-red-600" />
          </button>

          {/* GIF button (disabled) */}
          <button
            type="button"
            disabled={true}
            className="rounded-full p-2 hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
            title="GIF (Próximamente)"
          >
            <GifIcon className="h-6 w-6 text-purple-600" />
          </button>
        </div>
      </div>
    </div>
  )
}

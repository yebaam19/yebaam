'use client'

import { cn } from '@/lib/utils'
import { ChevronDownIcon } from '@/components/icons/heroicons-shim'
import { BACKGROUND_COLORS } from '../constants/post.constants'

interface PostColorPickerProps {
  backgroundColor?: string
  showColorPicker: boolean
  onTogglePicker: () => void
  onColorChange: (color: string | undefined) => void
  isDisabled: boolean
}

export default function PostColorPicker({
  backgroundColor,
  showColorPicker,
  onTogglePicker,
  onColorChange,
  isDisabled,
}: PostColorPickerProps) {
  return (
    <div className="border-b border-neutral-200 p-3 dark:border-neutral-800">
      <button
        type="button"
        onClick={onTogglePicker}
        disabled={isDisabled}
        className="flex w-full items-center justify-between text-sm font-semibold text-neutral-900 disabled:opacity-50 dark:text-white"
      >
        <span>Color de fondo</span>
        <ChevronDownIcon className={cn('h-4 w-4 transition-transform', showColorPicker && 'rotate-180')} />
      </button>

      {showColorPicker && (
        <div className="mt-3 grid grid-cols-8 gap-2">
          {BACKGROUND_COLORS.map((color) => (
            <button
              key={color.id}
              type="button"
              onClick={() => onColorChange(color.value === '#ffffff' ? undefined : color.value)}
              disabled={isDisabled}
              className={cn(
                'h-10 w-10 rounded-lg border-2 transition-all hover:scale-110 disabled:opacity-50',
                backgroundColor === color.value || (!backgroundColor && color.value === '#ffffff')
                  ? 'border-primary-600 ring-2 ring-primary-200'
                  : 'border-neutral-300 dark:border-neutral-700'
              )}
              style={{
                backgroundColor: color.value,
              }}
              title={color.name}
            />
          ))}
        </div>
      )}
    </div>
  )
}

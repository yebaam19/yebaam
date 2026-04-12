'use client'

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { FaceSmileIcon } from '@heroicons/react/24/outline'
import { ACTIVITIES, FEELINGS } from '../constants/post.constants'
import type { PostFeeling } from '../interfaces/post.interfaces'
import { cn } from '@/lib/utils'

interface PostFeelingPickerProps {
  onSelectFeeling: (feeling: PostFeeling) => void
  isDisabled: boolean
}

export default function PostFeelingPicker({ onSelectFeeling, isDisabled }: PostFeelingPickerProps) {
  return (
    <Menu as="div" className="relative">
      <MenuButton
        disabled={isDisabled}
        className="rounded-full p-2 hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
        title="Sentimiento/actividad"
      >
        <FaceSmileIcon className="h-6 w-6 text-yellow-600" />
      </MenuButton>
      <MenuItems className="absolute bottom-full left-0 z-50 mb-2 w-80 rounded-lg bg-white shadow-xl ring-1 ring-black/5 focus:outline-none dark:bg-neutral-800">
        <div className="p-2">
          <div className="mb-2 px-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            ¿Cómo te sientes?
          </div>
          <div className="max-h-48 overflow-y-auto">
            {FEELINGS.map((feeling) => (
              <MenuItem key={feeling.type}>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={() => onSelectFeeling({ ...feeling })}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm',
                      focus && 'bg-neutral-100 dark:bg-neutral-700'
                    )}
                  >
                    <span className="text-2xl">{feeling.emoji}</span>
                    <span className="text-neutral-900 dark:text-white">{feeling.label}</span>
                  </button>
                )}
              </MenuItem>
            ))}
          </div>

          <div className="mt-4 mb-2 px-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            ¿Qué estás haciendo?
          </div>
          <div className="max-h-48 overflow-y-auto">
            {ACTIVITIES.map((activity) => (
              <MenuItem key={activity.type}>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={() => onSelectFeeling({ ...activity })}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm',
                      focus && 'bg-neutral-100 dark:bg-neutral-700'
                    )}
                  >
                    <span className="text-2xl">{activity.emoji}</span>
                    <span className="text-neutral-900 dark:text-white">{activity.label}</span>
                  </button>
                )}
              </MenuItem>
            ))}
          </div>
        </div>
      </MenuItems>
    </Menu>
  )
}

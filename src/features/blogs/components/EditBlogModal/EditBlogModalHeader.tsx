'use client'

import { Dialog } from '@headlessui/react'
import { PencilIcon, XMarkIcon } from '@/components/icons/heroicons-shim'

interface EditBlogModalHeaderProps {
  title: string
  subtitle: string
  onClose: () => void
  disabled?: boolean
}

export const EditBlogModalHeader = ({ title, subtitle, onClose, disabled = false }: EditBlogModalHeaderProps) => {
  return (
    <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
      <div>
        <Dialog.Title
          as="h3"
          className="flex items-center gap-2 text-xl font-semibold text-neutral-900 dark:text-white"
        >
          <PencilIcon className="h-5 w-5" />
          {title}
        </Dialog.Title>
        <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
          {subtitle}
        </p>
      </div>
      <button
        onClick={onClose}
        disabled={disabled}
        className="rounded-full p-2 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-700"
      >
        <XMarkIcon className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
      </button>
    </div>
  )
}

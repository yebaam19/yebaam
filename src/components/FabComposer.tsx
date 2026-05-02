'use client'

import { PlusIcon } from '@/components/icons/heroicons-shim'

interface FabComposerProps {
  onClick: () => void
  className?: string
}

export default function FabComposer({ onClick, className }: FabComposerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Crear publicación"
      className={
        'fixed right-6 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-40 flex size-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-700 active:scale-95 ' +
        (className ?? '')
      }
    >
      <PlusIcon className="size-7" />
    </button>
  )
}

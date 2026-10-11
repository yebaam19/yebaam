import type { ReactNode } from 'react'

export const ToolbarButton = ({
    onClick,
    isActive,
    title,
    disabled,
    children,
  }: {
    onClick: () => void
    isActive?: boolean
    title: string
    disabled?: boolean
    children: ReactNode
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
        disabled
          ? 'cursor-not-allowed text-neutral-300 dark:text-neutral-600'
          : isActive
            ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
            : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700'
      }`}
    >
      {children}
    </button>
  )


'use client'

import { AcademicCapIcon } from '@/components/icons/heroicons-shim'
import { categoryLabel } from '../../lib/credentials'
import type { TitleCategory } from '../../interfaces/professional-profile.interfaces'

interface Props {
  category: TitleCategory
  size?: 'sm' | 'md'
}

const STYLES: Record<TitleCategory, string> = {
  bachiller: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
  tecnico: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
  tecnologo: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
  asociado: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
  licenciatura: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  maestria: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  doctorado: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
}

export function DegreeBadge({ category, size = 'sm' }: Props) {
  const cls = STYLES[category]
  const sz = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${cls} ${sz}`}
      title={`${categoryLabel(category)} verificada`}
    >
      <AcademicCapIcon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      {categoryLabel(category)}
    </span>
  )
}

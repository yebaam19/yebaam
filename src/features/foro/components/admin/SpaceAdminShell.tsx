'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import type {
  ForoCategory,
  ForoRoleMember,
  ForoSpace,
} from '@/features/foro/types'
import CategoriesAdmin from './CategoriesAdmin'
import ModeratorsAdmin from './ModeratorsAdmin'
import SpaceSettingsForm from './SpaceSettingsForm'

type TabKey = 'categories' | 'moderators' | 'settings'

interface Props {
  space: ForoSpace
  categories: ForoCategory[]
  roles: ForoRoleMember[]
}

export default function SpaceAdminShell({ space, categories, roles }: Props) {
  const [tab, setTab] = useState<TabKey>('categories')

  return (
    <div className="space-y-4">
      <nav className="text-xs text-neutral-500 dark:text-neutral-400">
        <Link href="/foro" className="hover:text-primary-700">
          Foros
        </Link>
        {' › '}
        <Link href={`/foro/${space.slug}` as Route} className="hover:text-primary-700">
          {space.name}
        </Link>
        {' › '}
        <span className="text-neutral-700 dark:text-neutral-300">Administración</span>
      </nav>

      <header>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Administrar {space.name}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Gestiona categorías, moderadores y ajustes del espacio.
        </p>
      </header>

      <div className="flex flex-wrap gap-1 border-b border-neutral-200 text-sm dark:border-neutral-800">
        {(
          [
            { key: 'categories', label: 'Categorías' },
            { key: 'moderators', label: 'Moderadores' },
            { key: 'settings', label: 'Ajustes' },
          ] as { key: TabKey; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-3 py-2 font-medium sm:px-4 ${
              tab === t.key
                ? 'border-primary-600 text-primary-700 dark:text-primary-400'
                : 'border-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'categories' && <CategoriesAdmin space={space} categories={categories} />}
      {tab === 'moderators' && <ModeratorsAdmin space={space} initial={roles} />}
      {tab === 'settings' && <SpaceSettingsForm space={space} />}
    </div>
  )
}

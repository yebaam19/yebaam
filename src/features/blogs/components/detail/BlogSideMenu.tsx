'use client'

import {
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  LinkIcon,
  LockClosedIcon,
  MegaphoneIcon,
  QuestionMarkCircleIcon,
  SpeakerWaveIcon,
  UserGroupIcon,
} from '@/components/icons/heroicons-shim'
import { useTranslations } from 'next-intl'
import type { ComponentType } from 'react'

interface BlogSideMenuProps {
  stars: 0 | 1 | 2 | 3 | 4 | 5
  onSelect: (key: BlogSideMenuItem) => void
}

export type BlogSideMenuItem =
  | 'chat'
  | 'members'
  | 'askme'
  | 'foro'
  | 'events'
  | 'promotions'
  | 'related'

interface MenuEntry {
  key: BlogSideMenuItem
  label: string
  icon: ComponentType<{ className?: string }>
  locked: boolean
  reason?: string
}

export const BlogSideMenu = ({ stars, onSelect }: BlogSideMenuProps) => {
  const tMenu = useTranslations('blogs.detail.menu')
  const tSide = useTranslations('blogs.sideMenu')

  const entries: MenuEntry[] = [
    {
      key: 'chat',
      label: tMenu('chat'),
      icon: SpeakerWaveIcon,
      locked: false,
    },
    {
      key: 'members',
      label: tMenu('members'),
      icon: UserGroupIcon,
      locked: false,
    },
    {
      key: 'askme',
      label: tMenu('askme'),
      icon: QuestionMarkCircleIcon,
      locked: false,
    },
    {
      key: 'foro',
      label: tMenu('foro'),
      icon: ChatBubbleLeftRightIcon,
      locked: false,
    },
    {
      key: 'events',
      label: tMenu('events'),
      icon: CalendarIcon,
      locked: false,
    },
    {
      key: 'promotions',
      label: tMenu('promotions'),
      icon: MegaphoneIcon,
      locked: stars < 3,
      reason: stars < 3 ? tSide('locked.stars3') : tSide('locked.yebaam'),
    },
    {
      key: 'related',
      label: tMenu('related'),
      icon: LinkIcon,
      locked: false,
    },
  ]

  return (
    <nav
      aria-label={tSide('aria')}
      className="-mx-1 flex shrink-0 flex-row gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:w-44 lg:flex-col lg:overflow-visible lg:pb-0"
    >
      {entries.map((entry) => {
        const Icon = entry.icon
        return (
          <button
            key={entry.key}
            type="button"
            onClick={() => (!entry.locked ? onSelect(entry.key) : undefined)}
            title={entry.locked ? entry.reason : entry.label}
            disabled={entry.locked}
            className={`group flex shrink-0 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-xs font-medium transition-colors sm:text-sm dark:border-neutral-700 dark:bg-neutral-800 ${
              entry.locked
                ? 'cursor-not-allowed text-neutral-400 dark:text-neutral-500'
                : 'text-neutral-700 hover:border-primary-400 hover:text-primary-600 dark:text-neutral-200 dark:hover:border-primary-400 dark:hover:text-primary-400'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{entry.label}</span>
            {entry.locked && <LockClosedIcon className="h-3.5 w-3.5 shrink-0" />}
          </button>
        )
      })}
    </nav>
  )
}

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
import { formatFollowersCount } from '../../utils/blogHelpers'

interface BlogSideMenuProps {
  /** Current follower count — gates the menu items per PDF thresholds. */
  followersCount: number
  /** The blog owner can always use their own tools, regardless of followers. */
  isOwner: boolean
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
  /** Follower count required to unlock (PDF "menú lateral"). Undefined = always open. */
  threshold?: number
}

export const BlogSideMenu = ({ followersCount, isOwner, onSelect }: BlogSideMenuProps) => {
  const tMenu = useTranslations('blogs.detail.menu')
  const tSide = useTranslations('blogs.sideMenu')

  const entries: MenuEntry[] = [
    { key: 'chat', label: tMenu('chat'), icon: SpeakerWaveIcon, threshold: 50000 },
    { key: 'members', label: tMenu('members'), icon: UserGroupIcon },
    { key: 'askme', label: tMenu('askme'), icon: QuestionMarkCircleIcon, threshold: 10000 },
    { key: 'foro', label: tMenu('foro'), icon: ChatBubbleLeftRightIcon, threshold: 25000 },
    { key: 'events', label: tMenu('events'), icon: CalendarIcon },
    { key: 'promotions', label: tMenu('promotions'), icon: MegaphoneIcon, threshold: 10000 },
    { key: 'related', label: tMenu('related'), icon: LinkIcon },
  ]

  return (
    <nav
      aria-label={tSide('aria')}
      className="-mx-1 flex shrink-0 flex-row gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:w-44 lg:flex-col lg:overflow-visible lg:pb-0"
    >
      {entries.map((entry) => {
        const locked = !isOwner && entry.threshold !== undefined && followersCount < entry.threshold
        const reason = locked
          ? tSide('locked.followers', { count: formatFollowersCount(entry.threshold!) })
          : undefined
        const Icon = entry.icon
        return (
          <button
            key={entry.key}
            type="button"
            onClick={() => (!locked ? onSelect(entry.key) : undefined)}
            title={locked ? reason : entry.label}
            disabled={locked}
            className={`group flex shrink-0 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-xs font-medium transition-colors sm:text-sm dark:border-neutral-700 dark:bg-neutral-800 ${
              locked
                ? 'cursor-not-allowed text-neutral-400 dark:text-neutral-500'
                : 'text-neutral-700 hover:border-primary-400 hover:text-primary-600 dark:text-neutral-200 dark:hover:border-primary-400 dark:hover:text-primary-400'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{entry.label}</span>
            {locked && <LockClosedIcon className="h-3.5 w-3.5 shrink-0" />}
          </button>
        )
      })}
    </nav>
  )
}

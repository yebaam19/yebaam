'use client'

/**
 * ArticleContextBadge Component
 *
 * Displays the context/origin of an article (Blog, Professional Profile, Personal).
 * Adapted from legacy ArticleWrapper.tsx component.
 */

import { BriefcaseIcon, DocumentTextIcon, UserIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { ArticleContextType } from '../interfaces'

interface ArticleContextBadgeProps {
  contextType: ArticleContextType
  contextId?: string | null
  authorUsername: string
  /** Whether to show as a full header bar or compact badge */
  variant?: 'header' | 'badge'
}

interface ContextInfo {
  icon: typeof DocumentTextIcon
  label: string
  color: string
  bgColor: string
  href: string
}

function getContextInfo(
  contextType: ArticleContextType,
  contextId: string | null | undefined,
  authorUsername: string
): ContextInfo {
  switch (contextType) {
    case ArticleContextType.BLOG:
      return {
        icon: DocumentTextIcon,
        label: 'Artículo de Blog',
        color: 'text-primary-600 dark:text-primary-400',
        bgColor: 'bg-primary-50 dark:bg-primary-900/30',
        href: contextId ? `/blogs/${contextId}` : '#',
      }
    case ArticleContextType.PROFESSIONAL:
      return {
        icon: BriefcaseIcon,
        label: 'Artículo Profesional',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-900/30',
        href: `/users/${authorUsername}/professional-profile`,
      }
    case ArticleContextType.CLUB:
      return {
        icon: UserIcon,
        label: 'Artículo de Club',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/30',
        href: contextId ? `/clubs/${contextId}` : '#',
      }
    case ArticleContextType.USER_PROFILE:
    default:
      return {
        icon: UserIcon,
        label: 'Artículo Personal',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/30',
        href: `/users/${authorUsername}`,
      }
  }
}

export function ArticleContextBadge({
  contextType,
  contextId,
  authorUsername,
  variant = 'badge',
}: ArticleContextBadgeProps) {
  const contextInfo = getContextInfo(contextType, contextId, authorUsername)
  const Icon = contextInfo.icon

  if (variant === 'header') {
    return (
      <div
        className={`flex items-center gap-2 border-b border-neutral-200 p-3 dark:border-neutral-700 ${contextInfo.bgColor}`}
      >
        <Icon className={`h-4 w-4 ${contextInfo.color}`} />
        <Link
          href={contextInfo.href}
          className={`text-sm font-medium transition-opacity hover:underline hover:opacity-80 ${contextInfo.color}`}
        >
          {contextInfo.label}
        </Link>
      </div>
    )
  }

  return (
    <Link
      href={contextInfo.href}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80 ${contextInfo.bgColor} ${contextInfo.color}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {contextInfo.label}
    </Link>
  )
}

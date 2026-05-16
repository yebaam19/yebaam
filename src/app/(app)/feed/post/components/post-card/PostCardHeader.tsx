'use client'

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { formatDistanceToNow } from 'date-fns'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  EllipsisHorizontalIcon,
  FlagIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@/components/icons/heroicons-shim'
import { getUserInitials } from '@/lib/user-helpers'
import { cn } from '@/lib/utils'
import { useDateFnsLocale } from '@/lib/utils/date-fns-locale'
import Avatar from '@/ui/Avatar'
import type { Post } from '../../interfaces/post.interfaces'

interface Props {
  post: Post
  isOwner: boolean
  isOptimistic: boolean
  onEdit: () => void
  onDeleteClick: () => void
}

export function PostCardHeader({ post, isOwner, isOptimistic, onEdit, onDeleteClick }: Props) {
  const t = useTranslations('feed')
  const dateLocale = useDateFnsLocale()
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: dateLocale })
  const authorInitials = getUserInitials(post.author.username)
  const privacyValue = post.privacy.value as 'public' | 'friends' | 'private'
  const privacyLabel = ['public', 'friends', 'private'].includes(privacyValue)
    ? t(`privacyLabel.${privacyValue}`)
    : ''

  return (
    <div className="flex items-start justify-between px-4 pt-4 pb-3">
      <div className="flex min-w-0 flex-1 gap-3">
        <Link href={`/${post.author.username}`} className="shrink-0">
          <Avatar src={post.author.avatar} initials={authorInitials} className="h-10 w-10" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/${post.author.username}`}
              className="font-semibold wrap-break-word text-neutral-900 hover:underline dark:text-white"
            >
              {post.author.firstName} {post.author.lastName}
            </Link>
            {post.author.isVerified && (
              <svg className="h-4 w-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {isOptimistic && (
              <span className="text-xs text-neutral-500 italic dark:text-neutral-400">
                {t('post.publishing')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
            <Link href={`/${post.author.username}/posts/${post.id}`} className="hover:underline">
              {timeAgo}
            </Link>
            <span>·</span>
            <span>{privacyLabel}</span>
          </div>
        </div>
      </div>

      <Menu as="div" className="relative z-10">
        <MenuButton className="rounded-full p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <EllipsisHorizontalIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
        </MenuButton>
        <MenuItems className="ring-opacity-5 absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black focus:outline-none dark:bg-neutral-800 dark:ring-neutral-700">
          <div className="py-1">
            {isOwner ? (
              <>
                <MenuItem>
                  {({ focus }) => (
                    <button
                      onClick={onEdit}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-neutral-700 transition-colors dark:text-neutral-200',
                        focus && 'bg-neutral-100 dark:bg-neutral-700',
                      )}
                    >
                      <PencilSquareIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                      {t('post.menu.edit')}
                    </button>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ focus }) => (
                    <button
                      onClick={onDeleteClick}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 transition-colors dark:text-red-500',
                        focus && 'bg-red-50 dark:bg-red-900/20',
                      )}
                    >
                      <TrashIcon className="h-5 w-5" />
                      {t('post.menu.delete')}
                    </button>
                  )}
                </MenuItem>
              </>
            ) : (
              <MenuItem>
                {({ focus }) => (
                  <button
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-neutral-700 transition-colors dark:text-neutral-200',
                      focus && 'bg-neutral-100 dark:bg-neutral-700',
                    )}
                  >
                    <FlagIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                    {t('post.menu.report')}
                  </button>
                )}
              </MenuItem>
            )}
          </div>
        </MenuItems>
      </Menu>
    </div>
  )
}

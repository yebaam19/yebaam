'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Post } from '../../interfaces/post.interfaces'
import {
  PostArticleLinkPreview,
  parseFirstArticleLink,
} from '../PostArticleLinkPreview'

interface Props {
  post: Post
}

/** A post's body: feeling line, text or sentiment block, location, tagged
 *  users, and the GIF if any. Media files render outside this component
 *  because they edge-bleed the card. */
export function PostCardContent({ post }: Props) {
  return (
    <>
      <div className="overflow-hidden px-4 pb-4">
        {post.feeling && (
          <div className="mb-2 flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
            <span className="wrap-break-word">
              {post.feeling.emoji && `${post.feeling.emoji} `}
              {post.feeling.prefix || 'se siente'} {post.feeling.label}
              {post.feeling.activity && ` ${post.feeling.activity}`}
            </span>
          </div>
        )}

        <PostBody post={post} />

        {post.location && (
          <div className="mt-2 flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="min-w-0 wrap-break-word">{post.location.name}</span>
          </div>
        )}

        {post.taggedUsers && post.taggedUsers.length > 0 && (
          <div className="mt-2 flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
            <span>con</span>
            {post.taggedUsers.map((user, idx) => (
              <span key={user.id}>
                <Link
                  href={`/${user.username}`}
                  className="font-semibold text-neutral-900 hover:underline dark:text-white"
                >
                  {user.firstName} {user.lastName}
                </Link>
                {idx < post.taggedUsers!.length - 1 && ', '}
              </span>
            ))}
          </div>
        )}
      </div>

      {post.gif && (
        <div className="px-4 pb-4">
          <div className="aspect-video relative overflow-hidden rounded-lg">
            <img
              src={post.gif.url}
              alt={post.gif.title || 'GIF'}
              className="h-full w-full bg-neutral-100 object-contain dark:bg-neutral-800"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </>
  )
}

const LIGHT_BG_COLORS = new Set(['#ffffff', '#FFFFFF', '#f1c40f', '#32CD32'])

function PostBody({ post }: { post: Post }) {
  const articleLink = parseFirstArticleLink(post.content)
  // When the only thing in the post is an article URL, hide the raw text so
  // the preview card stands on its own.
  const visibleContent = articleLink
    ? post.content?.replace(articleLink.matchedUrl, '').trim() ?? ''
    : post.content ?? ''
  const hasVisibleText = visibleContent.length > 0

  if (post.backgroundColor && hasVisibleText) {
    const len = visibleContent.length
    const textSize =
      len > 80
        ? 'text-base sm:text-lg'
        : len > 40
          ? 'text-lg sm:text-xl'
          : 'text-xl sm:text-2xl'
    const isLight =
      LIGHT_BG_COLORS.has(post.backgroundColor) ||
      post.backgroundColor.toLowerCase() === 'white'
    return (
      <div
        className="flex min-h-45 items-center justify-center overflow-hidden rounded-xl px-6 py-6 text-center sm:px-8"
        style={{
          backgroundColor: post.backgroundColor,
          color: isLight ? '#000000' : '#ffffff',
        }}
      >
        <p
          className={cn(
            'overflow-wrap-anywhere font-medium drop-shadow-md wrap-break-word',
            textSize,
          )}
        >
          {visibleContent}
        </p>
      </div>
    )
  }

  return (
    <>
      {hasVisibleText && (
        <p className="overflow-wrap-anywhere wrap-break-word whitespace-pre-wrap text-neutral-900 dark:text-white">
          {visibleContent}
        </p>
      )}
      {articleLink && (
        <PostArticleLinkPreview
          communitySlug={articleLink.communitySlug}
          articleSlug={articleLink.articleSlug}
        />
      )}
    </>
  )
}

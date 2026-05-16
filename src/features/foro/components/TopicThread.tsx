'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/features/auth'
import { subscribeToTable, unsubscribe } from '@/utils/supabase/realtime'
import { createClient } from '@/utils/supabase/client'
import {
  deletePost,
  deleteTopic,
  editPost,
  moveTopic,
  setTopicLocked,
  setTopicPinned,
} from '@/features/foro/actions/foro.actions'
import type {
  ForoForum,
  ForoPost,
  ForoPostAuthorMeta,
  ForoSpace,
  ForoTopic,
} from '@/features/foro/types'
import { formatRelativeDate } from '@/features/foro/utils/format'
import { Badge } from '@/ui/Badge'
import { Button } from '@/ui/Button'
import UserAvatar from './UserAvatar'
import ReplyForm, { type ReplyFormHandle } from './ReplyForm'
import ForoPagination from './Pagination'
import ForoHeader from './ForoHeader'
import PostContent from './PostContent'

interface Props {
  space: ForoSpace
  forum: ForoForum
  topic: ForoTopic
  initialPosts: ForoPost[]
  isModerator: boolean
  spaceForums: { id: string; name: string }[]
  page: number
  pageSize: number
  totalPosts: number
  /** Optional back-link to the forum's owning resource (e.g. the community). */
  ownerBack?: { href: string; label: string } | null
}

type PostInsertRow = {
  id: string
  topic_id: string
  author_id: string
  content: string
  created_at: string
  edited_at: string | null
  post_number?: number | null
}

type RankLabels = {
  legend: string
  veteran: string
  senior: string
  registered: string
  newbie: string
}

function userRank(
  postCount: number,
  labels: RankLabels,
): { label: string; color: React.ComponentProps<typeof Badge>['color'] } {
  if (postCount >= 1000) return { label: labels.legend, color: 'purple' }
  if (postCount >= 500) return { label: labels.veteran, color: 'indigo' }
  if (postCount >= 100) return { label: labels.senior, color: 'sky' }
  if (postCount >= 20) return { label: labels.registered, color: 'green' }
  return { label: labels.newbie, color: 'zinc' }
}

type UserCardStrings = {
  rank: RankLabels
  opLabel: string
  messagesLabel: string
  memberLabel: string
  locationLabel: string
}

function UserCard({
  author,
  meta,
  isOp,
  strings,
}: {
  author: ForoPost['author']
  meta?: ForoPostAuthorMeta
  isOp: boolean
  strings: UserCardStrings
}) {
  const rank = userRank(meta?.postCount ?? 0, strings.rank)
  return (
    <aside className="flex w-full items-center gap-3 border-b border-neutral-100 bg-primary-50/40 p-4 sm:w-44 sm:shrink-0 sm:flex-col sm:items-center sm:border-r sm:border-b-0 sm:text-center dark:border-neutral-800 dark:bg-primary-900/10">
      <Link href={`/@${author.username}` as Route} className="shrink-0">
        <UserAvatar author={author} className="h-12 w-12 sm:h-20 sm:w-20" />
      </Link>
      <div className="min-w-0 flex-1 sm:flex-none">
        <Link
          href={`/@${author.username}` as Route}
          className="block truncate text-sm font-semibold text-primary-700 hover:underline dark:text-primary-400"
        >
          {author.displayName}
        </Link>
        <div className="mt-0.5 flex flex-wrap gap-1 sm:justify-center">
          <Badge color={rank.color}>{rank.label}</Badge>
          {isOp && <Badge color="green">{strings.opLabel}</Badge>}
        </div>
      </div>
      <dl className="hidden w-full space-y-0.5 pt-2 text-[11px] text-neutral-500 sm:block dark:text-neutral-400">
        <div>
          <dt className="inline font-semibold text-neutral-600 dark:text-neutral-300">
            {strings.messagesLabel}
          </dt>{' '}
          <dd className="inline">{meta?.postCount ?? 0}</dd>
        </div>
        {meta?.joinedAt && (
          <div>
            <dt className="inline font-semibold text-neutral-600 dark:text-neutral-300">
              {strings.memberLabel}
            </dt>{' '}
            <dd className="inline">{formatRelativeDate(meta.joinedAt)}</dd>
          </div>
        )}
        {meta?.location && (
          <div>
            <dt className="inline font-semibold text-neutral-600 dark:text-neutral-300">
              {strings.locationLabel}
            </dt>{' '}
            <dd className="inline truncate">{meta.location}</dd>
          </div>
        )}
      </dl>
    </aside>
  )
}

export default function TopicThread({
  space,
  forum,
  topic,
  initialPosts,
  isModerator,
  spaceForums,
  page,
  pageSize,
  totalPosts,
  ownerBack,
}: Props) {
  const router = useRouter()
  const t = useTranslations('foro')
  const { user } = useAuth()
  const userCardStrings: UserCardStrings = {
    rank: {
      legend: t('thread.rank.legend'),
      veteran: t('thread.rank.veteran'),
      senior: t('thread.rank.senior'),
      registered: t('thread.rank.registered'),
      newbie: t('thread.rank.newbie'),
    },
    opLabel: t('thread.rank.op'),
    messagesLabel: t('thread.userCard.messages'),
    memberLabel: t('thread.userCard.member'),
    locationLabel: t('thread.userCard.location'),
  }
  const [posts, setPosts] = useState<ForoPost[]>(initialPosts)
  const [isLocked, setIsLocked] = useState(topic.isLocked)
  const [isPinned, setIsPinned] = useState(topic.isPinned)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [moveTargetId, setMoveTargetId] = useState<string>('')
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const replyRef = useRef<ReplyFormHandle>(null)

  const forumHref = `/foro/${space.slug}/${forum.slug}` as Route
  const topicHref = `${forumHref}/${topic.slug}` as Route
  const buildPageHref = (p: number) =>
    p === 1 ? String(topicHref) : `${topicHref}?page=${p}`

  useEffect(() => {
    const channel = subscribeToTable<PostInsertRow>({
      channel: `foro:topic:${topic.id}`,
      table: 'forum_posts',
      filter: `topic_id=eq.${topic.id}`,
      events: ['INSERT', 'UPDATE', 'DELETE'],
      onChange: async (payload) => {
        if (payload.eventType === 'DELETE') {
          const oldRow = payload.old as PostInsertRow
          if (oldRow?.id) setPosts((prev) => prev.filter((p) => p.id !== oldRow.id))
          return
        }
        if (payload.eventType === 'UPDATE') {
          const row = payload.new as PostInsertRow
          if (!row?.id) return
          setPosts((prev) =>
            prev.map((p) =>
              p.id === row.id ? { ...p, content: row.content, editedAt: row.edited_at } : p,
            ),
          )
          return
        }
        const row = payload.new as PostInsertRow
        if (!row?.id) return
        setPosts((prev) => {
          if (prev.some((p) => p.id === row.id)) return prev
          return [
            ...prev,
            {
              id: row.id,
              topicId: row.topic_id,
              content: row.content,
              createdAt: row.created_at,
              editedAt: row.edited_at,
              postNumber: row.post_number ?? prev.length + 1 + (page - 1) * pageSize,
              author: {
                id: row.author_id,
                username: t('thread.realtime.usernameFallback'),
                displayName: t('thread.realtime.loading'),
                avatarUrl: null,
              },
            },
          ]
        })
        const supabase = createClient()
        const { data } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, display_name, avatar_url')
          .eq('id', row.author_id)
          .maybeSingle()
        if (data) {
          const displayName =
            (data.display_name as string | null) ||
            [data.first_name, data.last_name].filter(Boolean).join(' ').trim() ||
            (data.username as string | null) ||
            t('thread.realtime.userFallback')
          setPosts((prev) =>
            prev.map((p) =>
              p.id === row.id
                ? {
                    ...p,
                    author: {
                      id: data.id as string,
                      username:
                        (data.username as string | null) ?? t('thread.realtime.usernameFallback'),
                      displayName,
                      avatarUrl: (data.avatar_url as string | null) ?? null,
                    },
                  }
                : p,
            ),
          )
        }
      },
    })
    return () => unsubscribe(channel)
  }, [topic.id, page, pageSize])

  const startEditing = (post: ForoPost) => {
    setEditingPostId(post.id)
    setEditingDraft(post.content)
    setEditError(null)
  }
  const cancelEditing = () => {
    setEditingPostId(null)
    setEditingDraft('')
    setEditError(null)
  }
  const handleSaveEdit = (postId: string) => {
    const content = editingDraft.trim()
    if (!content) {
      setEditError(t('thread.errors.emptyContent'))
      return
    }
    startTransition(async () => {
      const result = await editPost({ postId, content })
      if (!result.ok) {
        setEditError(result.error ?? t('thread.errors.editFailed'))
        return
      }
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, content, editedAt: result.editedAt ?? new Date().toISOString() }
            : p,
        ),
      )
      cancelEditing()
    })
  }
  const handleDeletePost = (postId: string) => {
    startTransition(async () => {
      const result = await deletePost(postId)
      if (result.ok) setPosts((prev) => prev.filter((p) => p.id !== postId))
    })
  }
  const handleDeleteTopic = () => {
    if (!confirm(t('thread.deleteConfirm'))) return
    startTransition(async () => {
      const result = await deleteTopic(topic.id)
      if (result.ok) router.push(forumHref)
    })
  }
  const handleTogglePinned = () => {
    startTransition(async () => {
      const next = !isPinned
      const result = await setTopicPinned(topic.id, next)
      if (result.ok) setIsPinned(next)
    })
  }
  const handleToggleLocked = () => {
    startTransition(async () => {
      const next = !isLocked
      const result = await setTopicLocked(topic.id, next)
      if (result.ok) setIsLocked(next)
    })
  }
  const handleMove = () => {
    if (!moveTargetId || moveTargetId === forum.id) {
      setShowMoveDialog(false)
      return
    }
    startTransition(async () => {
      const result = await moveTopic(topic.id, moveTargetId)
      setShowMoveDialog(false)
      if (result.ok && result.spaceSlug && result.forumSlug && result.topicSlug) {
        router.push(
          `/foro/${result.spaceSlug}/${result.forumSlug}/${result.topicSlug}` as Route,
        )
      }
    })
  }
  const handleQuote = (post: ForoPost) => {
    const preview = post.content.length > 400 ? post.content.slice(0, 400) + '…' : post.content
    const quoted = `[quote="${post.author.displayName}" post_id="${post.id}"]\n${preview}\n[/quote]\n\n`
    replyRef.current?.prepend(quoted)
  }

  const moveCandidates = useMemo(
    () => spaceForums.filter((f) => f.id !== forum.id),
    [spaceForums, forum.id],
  )

  const toolbar = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button
        type="button"
        onClick={() => replyRef.current?.focus()}
        disabled={isLocked}
        color="primary"
      >
        {isLocked ? t('thread.actions.topicLocked') : t('thread.actions.reply')}
      </Button>
      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
        <span>
          <strong className="text-neutral-900 dark:text-neutral-100">{totalPosts}</strong>{' '}
          {totalPosts === 1 ? t('thread.messageOne') : t('thread.messageOther')}
        </span>
        <ForoPagination
          page={page}
          pageSize={pageSize}
          total={totalPosts}
          buildHref={buildPageHref}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <ForoHeader
        title={topic.title}
        subtitle={t('thread.subtitle', {
          author: topic.author.displayName,
          date: formatRelativeDate(topic.createdAt),
          views: topic.viewCount,
          viewsLabel: topic.viewCount === 1 ? t('thread.viewOne') : t('thread.viewOther'),
        })}
        crumbs={[
          ...(ownerBack ? [{ href: ownerBack.href, label: `← ${ownerBack.label}` }] : []),
          { href: '/foro', label: t('crumbs.foros') },
          { href: `/foro/${space.slug}`, label: space.name },
          { href: forumHref, label: forum.name },
        ]}
        action={
          isModerator ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={handleTogglePinned} outline>
                {isPinned ? t('thread.actions.unpin') : t('thread.actions.pin')}
              </Button>
              <Button type="button" onClick={handleToggleLocked} outline>
                {isLocked ? t('thread.actions.reopen') : t('thread.actions.close')}
              </Button>
              {moveCandidates.length > 0 && (
                <Button type="button" onClick={() => setShowMoveDialog(true)} outline>
                  {t('thread.actions.move')}
                </Button>
              )}
              <Button type="button" onClick={handleDeleteTopic} color="red">
                {t('thread.actions.delete')}
              </Button>
            </div>
          ) : null
        }
      />

      {showMoveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-neutral-900">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {t('thread.moveDialog.title')}
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              {t('thread.moveDialog.description')}
            </p>
            <select
              value={moveTargetId}
              onChange={(e) => setMoveTargetId(e.target.value)}
              className="mt-3 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            >
              <option value="">{t('thread.moveDialog.placeholder')}</option>
              {moveCandidates.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" onClick={() => setShowMoveDialog(false)} plain>
                {t('thread.actions.cancel')}
              </Button>
              <Button type="button" onClick={handleMove} disabled={!moveTargetId} color="primary">
                {t('thread.actions.move')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {toolbar}

      <ol className="space-y-3">
        {posts.map((post) => {
          const isOwner = user?.id === post.author.id
          const canDelete = isModerator || isOwner
          const canEdit = isModerator || isOwner
          const isEditing = editingPostId === post.id
          const isOp = post.postNumber === 1
          return (
            <li
              key={post.id}
              id={`p${post.id}`}
              className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-colors target:border-primary-500 sm:flex dark:border-neutral-800 dark:bg-neutral-900"
            >
              <UserCard
                author={post.author}
                meta={post.authorMeta}
                isOp={isOp}
                strings={userCardStrings}
              />
              <div className="min-w-0 flex-1 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 pb-2 dark:border-neutral-800">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    <a
                      href={`#p${post.id}`}
                      className="font-semibold text-primary-700 hover:underline dark:text-primary-400"
                    >
                      #{post.postNumber}
                    </a>
                    {' · '}
                    {formatRelativeDate(post.createdAt)}
                    {post.editedAt && (
                      <span className="ml-1 text-neutral-400 italic">{t('thread.edited')}</span>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {!isLocked && user && (
                        <button
                          type="button"
                          onClick={() => handleQuote(post)}
                          className="text-primary-700 hover:underline dark:text-primary-400"
                        >
                          {t('thread.actions.quote')}
                        </button>
                      )}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => startEditing(post)}
                          className="text-primary-700 hover:underline dark:text-primary-400"
                        >
                          {t('thread.actions.edit')}
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="text-red-600 hover:underline"
                        >
                          {t('thread.actions.delete')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={editingDraft}
                      onChange={(e) => setEditingDraft(e.target.value)}
                      rows={4}
                      className="block w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                    />
                    {editError && <p className="text-xs text-red-600">{editError}</p>}
                    <div className="flex justify-end gap-2">
                      <Button type="button" onClick={cancelEditing} plain>
                        {t('thread.actions.cancel')}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleSaveEdit(post.id)}
                        color="primary"
                      >
                        {t('thread.actions.save')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <PostContent content={post.content} topicHref={String(topicHref)} />
                  </div>
                )}
                {post.authorMeta?.signature && !isEditing && (
                  <div className="mt-4 border-t border-dashed border-neutral-200 pt-2 text-[11px] whitespace-pre-wrap text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                    {post.authorMeta.signature}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {toolbar}

      <ReplyForm ref={replyRef} topicId={topic.id} isLocked={isLocked} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4 text-xs dark:border-neutral-800">
        <Link
          href={forumHref}
          className="text-primary-700 hover:underline dark:text-primary-400"
        >
          {t('thread.backToForum', { forumName: forum.name })}
        </Link>
        <Link href="/foro" className="text-primary-700 hover:underline dark:text-primary-400">
          {t('thread.goToIndex')}
        </Link>
      </div>
    </div>
  )
}

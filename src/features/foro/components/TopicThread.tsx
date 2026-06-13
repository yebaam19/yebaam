'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
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
  ForoSpace,
  ForoTopic,
} from '@/features/foro/types'
import { formatRelativeDate } from '@/features/foro/utils/format'
import { Button } from '@/ui/Button'
import ForoPagination from './Pagination'
import ThreadHeader from './TopicThread/ThreadHeader'
import ModerationMenu from './TopicThread/ModerationMenu'
import ReplyList from './TopicThread/ReplyList'
import { type UserCardStrings } from './TopicThread/ReplyList/UserCard'
import ReplyForm, { type ReplyFormHandle } from './TopicThread/ReplyForm'

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
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
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

  const startEditing = useCallback((post: ForoPost) => {
    setEditingPostId(post.id)
  }, [])
  const cancelEditing = useCallback(() => {
    setEditingPostId(null)
  }, [])
  const handleSaveEdit = useCallback(
    async (postId: string, content: string): Promise<{ ok: boolean; error?: string | null }> => {
      const result = await editPost({ postId, content })
      if (!result.ok) {
        return { ok: false, error: result.error ?? t('thread.errors.editFailed') }
      }
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, content, editedAt: result.editedAt ?? new Date().toISOString() }
            : p,
        ),
      )
      setEditingPostId(null)
      return { ok: true }
    },
    [t],
  )
  const handleDeletePost = useCallback((postId: string) => {
    startTransition(async () => {
      const result = await deletePost(postId)
      if (result.ok) setPosts((prev) => prev.filter((p) => p.id !== postId))
    })
  }, [])
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
  const handleMove = (moveTargetId: string) => {
    if (!moveTargetId || moveTargetId === forum.id) return
    startTransition(async () => {
      const result = await moveTopic(topic.id, moveTargetId)
      if (result.ok && result.spaceSlug && result.forumSlug && result.topicSlug) {
        router.push(
          `/foro/${result.spaceSlug}/${result.forumSlug}/${result.topicSlug}` as Route,
        )
      }
    })
  }
  const handleQuote = useCallback((post: ForoPost) => {
    const preview = post.content.length > 400 ? post.content.slice(0, 400) + '…' : post.content
    const quoted = `[quote="${post.author.displayName}" post_id="${post.id}"]\n${preview}\n[/quote]\n\n`
    replyRef.current?.prepend(quoted)
  }, [])

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
      <ThreadHeader
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
            <ModerationMenu
              isPinned={isPinned}
              isLocked={isLocked}
              moveCandidates={moveCandidates}
              onTogglePinned={handleTogglePinned}
              onToggleLocked={handleToggleLocked}
              onDelete={handleDeleteTopic}
              onMove={handleMove}
            />
          ) : null
        }
      />

      {toolbar}

      <ReplyList
        posts={posts}
        topicHref={String(topicHref)}
        isLocked={isLocked}
        isModerator={isModerator}
        currentUserId={user?.id}
        editingPostId={editingPostId}
        userCardStrings={userCardStrings}
        onStartEdit={startEditing}
        onCancelEdit={cancelEditing}
        onDeletePost={handleDeletePost}
        onQuote={handleQuote}
        onSaveEdit={handleSaveEdit}
      />

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

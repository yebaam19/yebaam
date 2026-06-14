'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
import { type ReplyFormHandle } from './ReplyForm'

export interface TopicThreadProps {
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

/** View-model for `TopicThread`: live post list (realtime `forum_posts`
 *  subscription + author back-fill), lock/pin/editing state, and the
 *  moderation/edit/delete/quote handlers — leaving the component pure UI. */
export function useTopicThread({
  space,
  forum,
  topic,
  initialPosts,
  spaceForums,
  page,
  pageSize,
}: TopicThreadProps) {
  const router = useRouter()
  const t = useTranslations('foro')
  const { user } = useAuth()
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

  return {
    user,
    posts,
    isLocked,
    isPinned,
    editingPostId,
    replyRef,
    forumHref,
    topicHref,
    buildPageHref,
    moveCandidates,
    startEditing,
    cancelEditing,
    handleSaveEdit,
    handleDeletePost,
    handleDeleteTopic,
    handleTogglePinned,
    handleToggleLocked,
    handleMove,
    handleQuote,
  }
}

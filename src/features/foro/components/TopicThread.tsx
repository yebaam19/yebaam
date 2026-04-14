'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { useAuth } from '@/features/auth'
import { subscribeToTable, unsubscribe } from '@/utils/supabase/realtime'
import { createClient } from '@/utils/supabase/client'
import {
  deletePost,
  deleteTopic,
  moveTopic,
  setTopicLocked,
  setTopicPinned,
} from '@/features/foro/actions/foro.actions'
import type { ForoForum, ForoPost, ForoSpace, ForoTopic } from '@/features/foro/types'
import { formatRelativeDate } from '@/features/foro/utils/format'
import ReplyForm from './ReplyForm'

interface Props {
  space: ForoSpace
  forum: ForoForum
  topic: ForoTopic
  initialPosts: ForoPost[]
  isModerator: boolean
  spaceForums: { id: string; name: string }[]
}

type PostInsertRow = {
  id: string
  topic_id: string
  author_id: string
  content: string
  created_at: string
  edited_at: string | null
}

export default function TopicThread({
  space,
  forum,
  topic,
  initialPosts,
  isModerator,
  spaceForums,
}: Props) {
  const router = useRouter()
  const { user } = useAuth()
  const [posts, setPosts] = useState<ForoPost[]>(initialPosts)
  const [isLocked, setIsLocked] = useState(topic.isLocked)
  const [isPinned, setIsPinned] = useState(topic.isPinned)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [moveTargetId, setMoveTargetId] = useState<string>('')
  const [, startTransition] = useTransition()

  useEffect(() => {
    const channel = subscribeToTable<PostInsertRow>({
      channel: `foro:topic:${topic.id}`,
      table: 'forum_posts',
      filter: `topic_id=eq.${topic.id}`,
      events: ['INSERT', 'DELETE'],
      onChange: async (payload) => {
        if (payload.eventType === 'DELETE') {
          const oldRow = payload.old as PostInsertRow
          if (oldRow?.id) setPosts((prev) => prev.filter((p) => p.id !== oldRow.id))
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
              author: {
                id: row.author_id,
                username: 'usuario',
                displayName: 'Cargando…',
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
            'Usuario'
          setPosts((prev) =>
            prev.map((p) =>
              p.id === row.id
                ? {
                    ...p,
                    author: {
                      id: data.id as string,
                      username: (data.username as string | null) ?? 'usuario',
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
  }, [topic.id])

  const handleDeletePost = (postId: string) => {
    startTransition(async () => {
      const result = await deletePost(postId)
      if (result.ok) setPosts((prev) => prev.filter((p) => p.id !== postId))
    })
  }

  const handleDeleteTopic = () => {
    if (!confirm('¿Eliminar este tema y todos sus mensajes?')) return
    startTransition(async () => {
      const result = await deleteTopic(topic.id)
      if (result.ok) router.push(`/foro/${space.slug}/${forum.slug}` as Route)
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
        router.push(`/foro/${result.spaceSlug}/${result.forumSlug}/${result.topicSlug}` as Route)
      }
    })
  }

  const moveCandidates = spaceForums.filter((f) => f.id !== forum.id)

  return (
    <div className="space-y-4">
      <nav className="text-xs text-neutral-500 dark:text-neutral-400">
        <Link href="/foro" className="hover:text-blue-600">
          Foros
        </Link>
        {' › '}
        <Link href={`/foro/${space.slug}` as Route} className="hover:text-blue-600">
          {space.name}
        </Link>
        {' › '}
        <Link href={`/foro/${space.slug}/${forum.slug}` as Route} className="hover:text-blue-600">
          {forum.name}
        </Link>
        {' › '}
        <span className="text-neutral-700 dark:text-neutral-300">{topic.title}</span>
      </nav>

      <header className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {topic.title}
            </h1>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Iniciado por{' '}
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {topic.author.displayName}
              </span>
              {' · '}
              {formatRelativeDate(topic.createdAt)}
            </p>
          </div>
          {isModerator && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleTogglePinned}
                className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {isPinned ? 'Quitar fijado' : 'Fijar'}
              </button>
              <button
                type="button"
                onClick={handleToggleLocked}
                className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {isLocked ? 'Reabrir' : 'Cerrar'}
              </button>
              {moveCandidates.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowMoveDialog(true)}
                  className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Mover
                </button>
              )}
              <button
                type="button"
                onClick={handleDeleteTopic}
                className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Eliminar tema
              </button>
            </div>
          )}
        </div>
      </header>

      {showMoveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl dark:bg-neutral-900">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Mover tema
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Selecciona el foro destino en este espacio.
            </p>
            <select
              value={moveTargetId}
              onChange={(e) => setMoveTargetId(e.target.value)}
              className="mt-3 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            >
              <option value="">— Elegir foro —</option>
              {moveCandidates.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowMoveDialog(false)}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleMove}
                disabled={!moveTargetId}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                Mover
              </button>
            </div>
          </div>
        </div>
      )}

      <ol className="space-y-3">
        {posts.map((post, idx) => {
          const canDelete = isModerator || user?.id === post.author.id
          return (
            <li
              key={post.id}
              className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {post.author.displayName}
                  </span>
                  {' · '}
                  {formatRelativeDate(post.createdAt)}
                  {idx === 0 && (
                    <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-blue-700 uppercase dark:bg-blue-900/40 dark:text-blue-300">
                      OP
                    </span>
                  )}
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDeletePost(post.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                )}
              </div>
              <div className="mt-3 text-sm whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
                {post.content}
              </div>
            </li>
          )
        })}
      </ol>

      <ReplyForm topicId={topic.id} isLocked={isLocked} />
    </div>
  )
}

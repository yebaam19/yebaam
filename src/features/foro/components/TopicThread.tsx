'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
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
import { LockClosedIcon } from '@/components/icons/heroicons-shim'
import type {
  ForoForum,
  ForoPost,
  ForoPostAuthorMeta,
  ForoSpace,
  ForoTopic,
} from '@/features/foro/types'
import { formatRelativeDate } from '@/features/foro/utils/format'
import ReplyForm, { type ReplyFormHandle } from './ReplyForm'
import ForoPagination from './Pagination'

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

function userRank(postCount: number): string {
  if (postCount >= 1000) return 'Usuario leyenda'
  if (postCount >= 500) return 'Usuario veterano'
  if (postCount >= 100) return 'Usuario sénior'
  if (postCount >= 20) return 'Usuario registrado'
  return 'Usuario nuevo'
}

function UserCard({
  author,
  meta,
  isOp,
}: {
  author: ForoPost['author']
  meta?: ForoPostAuthorMeta
  isOp: boolean
}) {
  return (
    <aside className="w-full border-b border-neutral-200 p-4 sm:w-48 sm:shrink-0 sm:border-r sm:border-b-0 dark:border-neutral-800">
      <div className="flex items-center gap-3 sm:block">
        {author.avatarUrl ? (
          <img
            src={author.avatarUrl}
            alt={author.displayName}
            className="h-12 w-12 rounded-full object-cover sm:h-20 sm:w-20"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-600 sm:h-20 sm:w-20 sm:text-xl dark:bg-neutral-800 dark:text-neutral-300">
            {author.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 sm:mt-2">
          <Link
            href={`/@${author.username}` as Route}
            className="block truncate text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            {author.displayName}
          </Link>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {userRank(meta?.postCount ?? 0)}
          </div>
          {isOp && (
            <span className="mt-1 inline-block rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-blue-700 uppercase dark:bg-blue-900/40 dark:text-blue-300">
              Autor del tema
            </span>
          )}
        </div>
      </div>
      <dl className="mt-3 hidden space-y-1 text-[11px] text-neutral-500 sm:block dark:text-neutral-400">
        <div>
          <dt className="inline font-semibold text-neutral-600 dark:text-neutral-300">
            Mensajes:
          </dt>{' '}
          <dd className="inline">{meta?.postCount ?? 0}</dd>
        </div>
        {meta?.joinedAt && (
          <div>
            <dt className="inline font-semibold text-neutral-600 dark:text-neutral-300">
              Se unió:
            </dt>{' '}
            <dd className="inline">{formatRelativeDate(meta.joinedAt)}</dd>
          </div>
        )}
        {meta?.location && (
          <div>
            <dt className="inline font-semibold text-neutral-600 dark:text-neutral-300">
              Ubicación:
            </dt>{' '}
            <dd className="inline">{meta.location}</dd>
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
}: Props) {
  const router = useRouter()
  const { user } = useAuth()
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
      setEditError('El mensaje no puede estar vacío.')
      return
    }
    startTransition(async () => {
      const result = await editPost({ postId, content })
      if (!result.ok) {
        setEditError(result.error ?? 'No se pudo editar el mensaje.')
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
    if (!confirm('¿Eliminar este tema y todos sus mensajes?')) return
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
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
      <button
        type="button"
        onClick={() => replyRef.current?.focus()}
        disabled={isLocked}
        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLocked ? 'Tema cerrado' : 'Responder'}
      </button>
      <div className="flex items-center gap-3">
        <span>
          <strong>{totalPosts}</strong> mensajes
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
      <nav className="text-xs text-neutral-500 dark:text-neutral-400">
        <Link href="/foro" className="hover:text-blue-600">
          Foros
        </Link>
        {' › '}
        <Link href={`/foro/${space.slug}` as Route} className="hover:text-blue-600">
          {space.name}
        </Link>
        {' › '}
        <Link href={forumHref} className="hover:text-blue-600">
          {forum.name}
        </Link>
        {' › '}
        <span className="text-neutral-700 dark:text-neutral-300">{topic.title}</span>
      </nav>

      <header className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {isLocked && <LockClosedIcon className="h-4 w-4 text-neutral-400" />}
              {topic.title}
            </h1>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Iniciado por{' '}
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {topic.author.displayName}
              </span>
              {' · '}
              {formatRelativeDate(topic.createdAt)}
              {' · '}
              {topic.viewCount} vistas
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
              className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm sm:flex dark:border-neutral-800 dark:bg-neutral-900"
            >
              <UserCard author={post.author} meta={post.authorMeta} isOp={isOp} />
              <div className="min-w-0 flex-1 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 pb-2 dark:border-neutral-800">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    <a
                      href={`#p${post.id}`}
                      className="font-semibold text-neutral-700 hover:text-blue-600 dark:text-neutral-300"
                    >
                      #{post.postNumber}
                    </a>
                    {' · '}
                    {formatRelativeDate(post.createdAt)}
                    {post.editedAt && (
                      <span className="ml-1 text-neutral-400 italic">(editado)</span>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-3 text-xs">
                      {!isLocked && user && (
                        <button
                          type="button"
                          onClick={() => handleQuote(post)}
                          className="text-blue-600 hover:underline"
                        >
                          Citar
                        </button>
                      )}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => startEditing(post)}
                          className="text-blue-600 hover:underline"
                        >
                          Editar
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="text-red-600 hover:underline"
                        >
                          Eliminar
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
                      className="block w-full resize-y rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                    />
                    {editError && <p className="text-xs text-red-600">{editError}</p>}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="rounded-md px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(post.id)}
                        className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-sm whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
                    {post.content}
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

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-3 text-xs dark:border-neutral-800">
        <Link href={forumHref} className="text-blue-600 hover:underline">
          ← Volver a «{forum.name}»
        </Link>
        <Link href="/foro" className="text-blue-600 hover:underline">
          Ir al índice de foros
        </Link>
      </div>
    </div>
  )
}

'use client'

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import {
  ChatBubbleLeftIcon,
  EllipsisHorizontalIcon,
  FlagIcon,
  PencilSquareIcon,
  ShareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { memo, useState } from 'react'

import { CommentList } from '@/app/(app)/feed/comments'
import { ReactionButton, ReactionStats } from '@/app/(app)/feed/reacions'
import { useAuth } from '@/features/auth'
import { getUserInitials } from '@/lib/user-helpers'
import { cn } from '@/lib/utils'
import Avatar from '@/ui/Avatar'
import type { Post } from '../interfaces/post.interfaces'
import { usePostStore } from '../stores/post.store'
import DeletePostModal from './DeletePostModal'
import PostMedia from './PostMedia'

interface PostCardProps {
  post: Post
  className?: string
}

function PostCard({ post, className }: PostCardProps) {
  const { user } = useAuth()
  const { deletePost, openEditModal } = usePostStore()
  const [showComments, setShowComments] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Defensive checks - retornar null silenciosamente si el post es inválido
  if (!post || !post.author || !post.id) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Post inválido omitido:', post)
    }
    return null
  }

  const isOwner = user?.id === post.author.id

  // Manejadores
  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      await deletePost(post.id)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleEdit = () => {
    openEditModal(post)
  }

  const handleShare = () => {
    // TODO: Implementar compartir
    console.log('Share post:', post.id)
  }

  // Formatear fecha
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: es,
  })

  // Generar iniciales del autor
  const authorInitials = getUserInitials(post.author.username)

  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl bg-white shadow-sm dark:bg-neutral-900',
        (post as any).isOptimistic && 'pointer-events-none opacity-70', // Post optimista
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4">
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
              {/* Indicador de post optimista */}
              {(post as any).isOptimistic && (
                <span className="text-xs text-neutral-500 italic dark:text-neutral-400">Publicando...</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
              <Link href={`/${post.author.username}/posts/${post.id}`} className="hover:underline">
                {timeAgo}
              </Link>
              <span>·</span>
              <span>
                {post.privacy.value === 'public' && 'publico'}
                {post.privacy.value === 'friends' && 'amigos'}
                {post.privacy.value === 'private' && 'Solo yo'}
              </span>
            </div>
          </div>
        </div>

        {/* Options Menu */}
        <Menu as="div" className="relative z-10">
          <MenuButton className="rounded-full p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <EllipsisHorizontalIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
          </MenuButton>
          <MenuItems className="ring-opacity-5 absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black focus:outline-none dark:bg-neutral-800 dark:ring-neutral-700">
            <div className="py-1">
              {isOwner && (
                <>
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        onClick={handleEdit}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-neutral-700 transition-colors dark:text-neutral-200',
                          focus && 'bg-neutral-100 dark:bg-neutral-700'
                        )}
                      >
                        <PencilSquareIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                        Editar publicación
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        onClick={handleDeleteClick}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 transition-colors dark:text-red-500',
                          focus && 'bg-red-50 dark:bg-red-900/20'
                        )}
                      >
                        <TrashIcon className="h-5 w-5" />
                        Eliminar publicación
                      </button>
                    )}
                  </MenuItem>
                </>
              )}
              {!isOwner && (
                <MenuItem>
                  {({ focus }) => (
                    <button
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-neutral-700 transition-colors dark:text-neutral-200',
                        focus && 'bg-neutral-100 dark:bg-neutral-700'
                      )}
                    >
                      <FlagIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                      Reportar publicación
                    </button>
                  )}
                </MenuItem>
              )}
            </div>
          </MenuItems>
        </Menu>
      </div>

      {/* Content */}
      <div className="overflow-hidden px-4 pb-3">
        {/* Sentimiento/Actividad */}
        {post.feeling && (
          <div className="mb-2 flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
            <span className="wrap-break-word">
              {post.feeling.emoji && `${post.feeling.emoji} `}
              {post.feeling.prefix || 'se siente'} {post.feeling.label}
              {post.feeling.activity && ` ${post.feeling.activity}`}
            </span>
          </div>
        )}

        {/* Contenido con fondo de color o texto normal */}
        {post.backgroundColor ? (
          <div
            className="overflow-hidden rounded-xl p-8 text-center"
            style={{
              backgroundColor: post.backgroundColor,
              color:
                post.backgroundColor === '#ffffff' ||
                post.backgroundColor === '#FFFFFF' ||
                post.backgroundColor.toLowerCase() === 'white' ||
                post.backgroundColor === '#f1c40f' || // Amarillo
                post.backgroundColor === '#32CD32' // Lima
                  ? '#000000'
                  : '#ffffff',
            }}
          >
            <p className="overflow-wrap-anywhere text-2xl font-medium wrap-break-word drop-shadow-lg">{post.content}</p>
          </div>
        ) : (
          <p className="overflow-wrap-anywhere wrap-break-word whitespace-pre-wrap text-neutral-900 dark:text-white">
            {post.content}
          </p>
        )}

        {/* Ubicación */}
        {post.location && (
          <div className="mt-2 flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="min-w-0 wrap-break-word">{post.location.name}</span>
          </div>
        )}

        {/* Usuarios etiquetados */}
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

      {/* GIF */}
      {post.gif && (
        <div className="px-4 pb-3">
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

      {/* Media Files (Imágenes y Videos) */}
      {post.mediaFiles && post.mediaFiles.length > 0 && (
        <PostMedia
          mediaFiles={post.mediaFiles}
          isLiveStream={post.content?.includes(' Transmisión en vivo finalizada')}
        />
      )}

      {/* Stats */}
      <div className="flex items-center justify-between px-4 py-2">
        <ReactionStats postId={post.id} username={post.author.username} reactionsCount={post.reactionsCount} />
      </div>

      {/* Actions */}
      <div className="border-t border-neutral-200 px-2 py-1 dark:border-neutral-800">
        <div className="flex items-center justify-around">
          <ReactionButton postId={post.id} />

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <ChatBubbleLeftIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Comentar</span>
          </button>

          <button
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <ShareIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Compartir</span>
          </button>
        </div>
      </div>

      {/* Comments Section - Siempre mostrar comentarios como Facebook */}
      <div className="border-t border-neutral-200 dark:border-neutral-800">
        <CommentList postId={post.id} showInput={showComments} maxHeight="400px" />
      </div>

      {/* Modal de confirmación de eliminación */}
      <DeletePostModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </article>
  )
}
export default memo(PostCard, (prevProps, nextProps) => {
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.content === nextProps.post.content &&
    prevProps.post.backgroundColor === nextProps.post.backgroundColor &&
    prevProps.post.updatedAt === nextProps.post.updatedAt &&
    prevProps.className === nextProps.className
  )
})

'use client'

import type { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces'
import { ChatBubbleLeftIcon, HeartIcon, PhotoIcon, PlayIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import { useState } from 'react'

interface MediaItem {
  id: string
  url: string
  type: string // Puede ser 'IMAGE'/'VIDEO' o 'image'/'video'
  postId: string
  post: Post
  thumbnail?: string
  duration?: number
}

interface BlogMediaGridProps {
  posts: Post[]
  type: string // Puede ser 'IMAGE'/'VIDEO' o 'image'/'video'
}

export const BlogMediaGrid = ({ posts, type }: BlogMediaGridProps) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)

  // Normalizar el tipo a uppercase para comparaciones
  const normalizedType = type.toUpperCase()

  // Extraer media de los posts
  const mediaItems: MediaItem[] = posts.flatMap((post) =>
    (post.mediaFiles || [])
      .filter((media) => media.type?.toUpperCase() === normalizedType)
      .map((media) => ({
        id: media.s3Key || media.url,
        url: media.url,
        type: media.type || 'IMAGE',
        postId: post.id,
        post: post,
        thumbnail: media.type?.toUpperCase() === 'VIDEO' ? media.url : undefined,
        duration: media.duration,
      }))
  )

  const formatDuration = (seconds?: number) => {
    if (!seconds) return ''
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (mediaItems.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          {normalizedType === 'IMAGE' ? (
            <PhotoIcon className="h-10 w-10 text-neutral-400 dark:text-neutral-600" />
          ) : (
            <PlayIcon className="h-10 w-10 text-neutral-400 dark:text-neutral-600" />
          )}
        </div>
        <h3 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-white">
          No hay {normalizedType === 'IMAGE' ? 'fotos' : 'videos'}
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400">
          Crea una publicación con {normalizedType === 'IMAGE' ? 'fotos' : 'videos'} para comenzar.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Grid de media */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {mediaItems.map((media) => (
          <div
            key={media.id}
            onClick={() => setSelectedMedia(media)}
            className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-neutral-200 transition-opacity hover:opacity-90 dark:bg-neutral-800"
          >
            <Image
              src={media.url}
              alt={media.post.content || 'Media'}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />

            {/* Overlay para videos */}
            {normalizedType === 'VIDEO' && (
              <>
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90">
                    <PlayIcon className="ml-1 h-6 w-6 text-neutral-900" />
                  </div>
                </div>
                {media.duration && (
                  <div className="absolute right-2 bottom-2 rounded bg-black/80 px-2 py-0.5 text-xs font-semibold text-white">
                    {formatDuration(media.duration)}
                  </div>
                )}
              </>
            )}

            {/* Stats overlay on hover */}
            <div className="absolute inset-0 flex items-end bg-black/50 p-2 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex items-center gap-3 text-xs text-white">
                <div className="flex items-center gap-1">
                  <HeartIcon className="h-4 w-4" />
                  <span>{media.post.reactionsCount?.like || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ChatBubbleLeftIcon className="h-4 w-4" />
                  <span>{media.post.commentsCount || 0}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de vista completa */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 z-10 text-white hover:text-gray-300"
          >
            <XMarkIcon className="h-8 w-8" />
          </button>

          <div
            className="w-full max-w-6xl overflow-hidden rounded-lg bg-white dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid md:grid-cols-2">
              {/* Media */}
              <div className="relative flex min-h-[400px] items-center justify-center bg-black md:min-h-[600px]">
                {selectedMedia.type?.toUpperCase() === 'VIDEO' ? (
                  <video src={selectedMedia.url} controls autoPlay className="h-full w-full">
                    Tu navegador no soporta el elemento de video.
                  </video>
                ) : (
                  <Image src={selectedMedia.url} alt="Media" fill className="object-contain" />
                )}
              </div>

              {/* Info del post */}
              <div className="flex flex-col p-6">
                {/* User info */}
                <div className="mb-4 flex items-center gap-3 border-b border-neutral-200 pb-4 dark:border-neutral-700">
                  {selectedMedia.post.author?.avatar ? (
                    <Image
                      src={selectedMedia.post.author.avatar}
                      alt={selectedMedia.post.author.username || 'User'}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-300 dark:bg-neutral-600">
                      <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                        {selectedMedia.post.author?.firstName?.[0] || 'U'}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      {selectedMedia.post.author?.firstName} {selectedMedia.post.author?.lastName}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      @{selectedMedia.post.author?.username}
                    </p>
                  </div>
                </div>

                {/* Content */}
                {selectedMedia.post.content && (
                  <div className="mb-4">
                    <p className="whitespace-pre-wrap text-gray-900 dark:text-white">{selectedMedia.post.content}</p>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6 border-t border-gray-200 pt-4 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <HeartIcon className="h-5 w-5 text-red-500" />
                    <span>{selectedMedia.post.reactionsCount?.like || 0} Me gusta</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <ChatBubbleLeftIcon className="h-5 w-5" />
                    <span>{selectedMedia.post.commentsCount || 0} Comentarios</span>
                  </div>
                </div>

                {/* Date */}
                <div className="mt-auto pt-4 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(selectedMedia.post.createdAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

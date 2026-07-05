import Image from 'next/image'
import Link from 'next/link'
import {
  ChatBubbleLeftIcon,
  HandThumbUpIcon,
  PlayIcon,
} from '@/components/icons/heroicons-shim'
import { streamThumb } from '@/lib/media/urls'
import type { OwnerPostCard, OwnerPostMedia } from '../../../server/owner-content.server'

interface PostsFeedProps {
  posts: OwnerPostCard[]
}

/**
 * Feed de publicaciones del perfil: tarjetas compactas con las últimas
 * publicaciones públicas del dueño (leídas en el servidor vía
 * `getOwnerPublicPosts`). Cada tarjeta enlaza al detalle `/feed/post/[postId]`.
 */
export function PostsFeed({ posts }: PostsFeedProps) {
  if (posts.length === 0) {
    return (
      <div className="flex h-32 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white text-center dark:border-neutral-700 dark:bg-neutral-800">
        <p className="px-4 text-sm text-neutral-500 dark:text-neutral-400">
          Este profesional aún no tiene publicaciones.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCardCompact key={post.id} post={post} />
      ))}
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function PostCardCompact({ post }: { post: OwnerPostCard }) {
  return (
    <Link
      href={`/feed/post/${post.id}`}
      className="block rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-neutral-800"
    >
      <article className="flex items-start gap-4">
        {post.media && <MediaThumb media={post.media} />}

        <div className="min-w-0 flex-1">
          {post.content ? (
            <p className="line-clamp-3 text-sm whitespace-pre-line text-neutral-800 dark:text-neutral-100">
              {post.content}
            </p>
          ) : (
            <p className="text-sm text-neutral-500 italic dark:text-neutral-400">
              Publicación multimedia
            </p>
          )}

          <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
            <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
            <span className="inline-flex items-center gap-1">
              <HandThumbUpIcon className="h-3.5 w-3.5" />
              {post.reactionsCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
              {post.commentsCount}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

function MediaThumb({ media }: { media: OwnerPostMedia }) {
  const src =
    media.kind === 'image'
      ? media.url
      : (media.thumbnailUrl ?? streamThumb(media.streamUid, { width: 320, height: 320 }))

  return (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-200 sm:h-24 sm:w-24 dark:bg-neutral-700">
      <Image src={src} alt="" fill className="object-cover" sizes="96px" />
      {media.kind === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90">
            <PlayIcon className="h-4 w-4 text-neutral-900" />
          </div>
        </div>
      )}
    </div>
  )
}

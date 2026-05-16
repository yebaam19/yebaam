'use client'

import { memo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { CommentList } from '@/app/(app)/feed/comments'
import { ReactionListModal } from '@/app/(app)/feed/reacions'
import { useAuth } from '@/features/auth'
import { cn } from '@/lib/utils'
import type { Post } from '../interfaces/post.interfaces'
import { usePostStore } from '../stores/post.store'
import DeletePostModal from './DeletePostModal'
import PostMedia from './PostMedia'
import { PostCardContent } from './post-card/PostCardContent'
import { PostCardFooter } from './post-card/PostCardFooter'
import { PostCardHeader } from './post-card/PostCardHeader'

interface PostCardProps {
  post: Post
  className?: string
  /**
   * Opt-in override for the reaction summary click. When omitted, the card
   * opens its own embedded ReactionListModal — that's how the feed timeline,
   * profile grids, and any other surface get the "who reacted" list for
   * free. Pass a callback only when the host page wants to manage modal
   * state itself (e.g. the post-detail page already does).
   */
  onShowReactions?: () => void
}

function PostCard({ post, className, onShowReactions }: PostCardProps) {
  const t = useTranslations('feed')
  const { user } = useAuth()
  const { deletePost, openEditModal } = usePostStore()
  const [showComments, setShowComments] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [reactionsModalOpen, setReactionsModalOpen] = useState(false)

  if (!post || !post.author || !post.id) return null

  const isOwner = user?.id === post.author.id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isOptimistic = Boolean((post as any).isOptimistic)

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      await deletePost(post.id)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleShare = async () => {
    if (typeof window === 'undefined') return
    const url = `${window.location.origin}/${post.author.username}/posts/${post.id}`
    const shareData = {
      title: t('post.shareTitle', { author: post.author.firstName ?? post.author.username }),
      text: post.content?.slice(0, 140) ?? '',
      url,
    }

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData)
        return
      }
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return
    }

    try {
      await navigator.clipboard.writeText(url)
      toast.success(t('post.shareLinkCopied'))
    } catch {
      toast.error(t('post.shareLinkError'))
    }
  }

  return (
    <article
      className={cn(
        'rounded-xl bg-white shadow-sm dark:bg-neutral-900',
        isOptimistic && 'pointer-events-none opacity-70',
        className,
      )}
    >
      <PostCardHeader
        post={post}
        isOwner={isOwner}
        isOptimistic={isOptimistic}
        onEdit={() => openEditModal(post)}
        onDeleteClick={() => setShowDeleteModal(true)}
      />

      <PostCardContent post={post} />

      {post.mediaFiles && post.mediaFiles.length > 0 && (
        <PostMedia
          mediaFiles={post.mediaFiles}
          isLiveStream={post.content?.includes(' Transmisión en vivo finalizada')}
        />
      )}

      <PostCardFooter
        post={post}
        onShowReactions={onShowReactions ?? (() => setReactionsModalOpen(true))}
        onToggleComments={() => setShowComments((v) => !v)}
        onShare={handleShare}
      />

      {showComments && (
        <div className="border-t border-neutral-200 dark:border-neutral-800">
          <CommentList postId={post.id} showInput maxHeight="400px" />
        </div>
      )}

      <DeletePostModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {!onShowReactions && (
        <ReactionListModal
          isOpen={reactionsModalOpen}
          onClose={() => setReactionsModalOpen(false)}
          postId={post.id}
        />
      )}
    </article>
  )
}

export default memo(PostCard, (prevProps, nextProps) => {
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.content === nextProps.post.content &&
    prevProps.post.backgroundColor === nextProps.post.backgroundColor &&
    prevProps.post.updatedAt === nextProps.post.updatedAt &&
    prevProps.post.reactionsCount === nextProps.post.reactionsCount &&
    prevProps.className === nextProps.className &&
    prevProps.onShowReactions === nextProps.onShowReactions
  )
})

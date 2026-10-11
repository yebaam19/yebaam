'use client'

import dynamic from 'next/dynamic'

interface CommentReplyComposerProps {
  postId: string
  parentCommentId: string
  replyingTo: {
    username: string
    fullName: string
  }
  onCancel: () => void
  onReplyCreated: () => void
}

export function CommentReplyComposer({
  postId,
  parentCommentId,
  replyingTo,
  onCancel,
  onReplyCreated,
}: CommentReplyComposerProps) {
  return (
    <div className="bg-white pr-4 pb-3 pl-14 dark:bg-neutral-900">
      {typeof window !== 'undefined' && (
        <CommentReplyInputLazy
          postId={postId}
          parentCommentId={parentCommentId}
          replyingTo={replyingTo}
          onCancel={onCancel}
          onReplyCreated={onReplyCreated}
        />
      )}
    </div>
  )
}

const CommentReplyInputLazy = dynamic(() => import('../CommentReplyInput').then((module) => module.CommentReplyInput), { ssr: false })

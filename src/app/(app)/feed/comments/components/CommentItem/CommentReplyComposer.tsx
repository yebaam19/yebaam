'use client'

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

// Lazy import para evitar importación circular
const CommentReplyInputLazy = (props: any) => {
  const { CommentReplyInput } = require('../CommentReplyInput')
  return <CommentReplyInput {...props} />
}

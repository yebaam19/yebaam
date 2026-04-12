import { getUserInitials } from '@/lib/user-helpers'
import Avatar from '@/ui/Avatar'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import type { CommentAuthor } from '../interfaces/comment.interfaces'

interface CommentHeaderProps {
  author: CommentAuthor
  createdAt: string
  isEdited?: boolean
  editedAt?: string
  isReply?: boolean
}

export function CommentHeader({ author, createdAt, isEdited, editedAt, isReply = false }: CommentHeaderProps) {
  const timeAgo = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: es,
  })

  const editedTimeAgo = editedAt
    ? formatDistanceToNow(new Date(editedAt), {
        addSuffix: true,
        locale: es,
      })
    : null

  const initials = getUserInitials(author.username)

  return (
    <div className="flex items-center gap-2.5">
      <Link href={`/${author.username}`} className="shrink-0">
        <Avatar
          src={author.avatar}
          initials={initials}
          alt={`${author.firstName} ${author.lastName}`}
          className={isReply ? 'h-7 w-7' : 'h-8 w-8'}
        />
      </Link>

      <div className="flex min-w-0 flex-col">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={`/${author.username}`}
            className="truncate text-sm font-semibold text-neutral-900 hover:underline dark:text-white"
          >
            {author.firstName} {author.lastName}
          </Link>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">@{author.username}</span>
          <span className="text-neutral-300 dark:text-neutral-600">·</span>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">{timeAgo}</span>
          {isEdited && (
            <>
              <span className="text-neutral-300 dark:text-neutral-600">·</span>
              <span
                className="text-xs text-neutral-400 italic dark:text-neutral-500"
                title={editedTimeAgo ? `Editado ${editedTimeAgo}` : 'Editado'}
              >
                editado
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

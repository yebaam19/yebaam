import Avatar from '@/ui/Avatar'
import { initialsFrom } from '@/features/foro/utils/owner'
import type { ForoAuthor } from '@/features/foro/types'

interface Props {
  author: ForoAuthor
  className?: string
}

export default function UserAvatar({ author, className = 'h-8 w-8' }: Props) {
  return (
    <Avatar
      src={author.avatarUrl}
      initials={initialsFrom(author.displayName)}
      alt={author.displayName}
      className={className}
    />
  )
}

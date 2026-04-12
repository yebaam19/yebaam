import { DocumentTextIcon, EyeIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { formatFollowersCount, formatViewsCount } from '../utils/blogHelpers'

interface BlogStatsProps {
  followersCount: number
  postsCount: number
  totalViews: number
}

export const BlogStats = ({ followersCount, postsCount, totalViews }: BlogStatsProps) => {
  return (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex items-center gap-1.5">
        <UserGroupIcon className="h-5 w-5 text-neutral-400" />
        <span className="font-semibold text-neutral-900 dark:text-white">{formatFollowersCount(followersCount)}</span>
        <span className="text-neutral-600 dark:text-neutral-400">seguidores</span>
      </div>

      <div className="flex items-center gap-1.5">
        <DocumentTextIcon className="h-5 w-5 text-neutral-400" />
        <span className="font-semibold text-neutral-900 dark:text-white">{postsCount}</span>
        <span className="text-neutral-600 dark:text-neutral-400">posts</span>
      </div>

      <div className="flex items-center gap-1.5">
        <EyeIcon className="h-5 w-5 text-neutral-400" />
        <span className="font-semibold text-neutral-900 dark:text-white">{formatViewsCount(totalViews)}</span>
        <span className="text-neutral-600 dark:text-neutral-400">vistas</span>
      </div>
    </div>
  )
}

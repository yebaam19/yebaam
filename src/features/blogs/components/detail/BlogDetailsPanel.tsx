'use client'

import {
  GlobeAltIcon,
  MapPinIcon,
  ShareIcon,
  TagIcon,
  UserGroupIcon,
} from '@/components/icons/heroicons-shim'
import type { Blog } from '../../types/blog.types'
import { formatFollowersCount, getCategoryLabel } from '../../utils/blogHelpers'
import { safeExternalHref } from '@/lib/safe-href'

interface BlogDetailsPanelProps {
  blog: Blog
}

export const BlogDetailsPanel = ({ blog }: BlogDetailsPanelProps) => {
  const socialEntries = Object.entries(blog.social ?? {}).filter(([, v]) => !!v)
  const websiteHref = safeExternalHref(blog.website)

  return (
    <aside className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-700 dark:bg-neutral-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        Detalles
      </h2>

      <Row icon={TagIcon} label="Categoría" value={getCategoryLabel(blog.category)} />
      {blog.subcategory && <Row icon={TagIcon} label="Subcategoría" value={blog.subcategory} />}
      <Row icon={MapPinIcon} label="Ubicación" value="—" />
      <Row
        icon={UserGroupIcon}
        label="Seguidores"
        value={formatFollowersCount(blog.stats?.followersCount ?? 0)}
      />

      {websiteHref && (
        <a
          href={websiteHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-md bg-neutral-50 px-2 py-1.5 text-primary-600 hover:underline dark:bg-neutral-900 dark:text-primary-400"
        >
          <GlobeAltIcon className="h-4 w-4" />
          <span className="truncate">{(blog.website ?? websiteHref).replace(/^https?:\/\//, '')}</span>
        </a>
      )}

      {socialEntries.length > 0 && (
        <div className="border-t border-neutral-200 pt-3 dark:border-neutral-700">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            <ShareIcon className="h-3.5 w-3.5" />
            Otras redes
          </div>
          <ul className="flex flex-col gap-1">
            {socialEntries.map(([platform, handle]) => (
              <li key={platform} className="flex items-center justify-between gap-2">
                <span className="capitalize text-neutral-500 dark:text-neutral-400">{platform}</span>
                <span className="truncate text-neutral-800 dark:text-neutral-200">{handle as string}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}

interface RowProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}

const Row = ({ icon: Icon, label, value }: RowProps) => (
  <div className="flex items-center gap-2">
    <Icon className="h-4 w-4 text-neutral-400" />
    <span className="text-neutral-500 dark:text-neutral-400">{label}:</span>
    <span className="ml-auto truncate font-medium text-neutral-800 dark:text-neutral-100">{value}</span>
  </div>
)

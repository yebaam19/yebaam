import { GlobeAltIcon } from '@/components/icons/heroicons-shim'
import type { Blog } from '../types/blog.types'
import { safeExternalHref } from '@/lib/safe-href'

interface BlogAboutSectionProps {
  blog: Blog
}

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  facebook: 'Facebook',
  twitter: 'X / Twitter',
}

const SOCIAL_BASE: Record<string, string> = {
  instagram: 'https://instagram.com/',
  twitter: 'https://x.com/',
  youtube: 'https://youtube.com/@',
  facebook: 'https://facebook.com/',
}

/** Build a link from either a full URL or a handle, per platform (http/https only). */
function toHref(key: string, value: string): string | null {
  if (value.startsWith('http')) return safeExternalHref(value)
  const handle = value.replace(/^@/, '')
  const base = SOCIAL_BASE[key]
  return safeExternalHref(base ? base + handle : `https://${handle}`)
}

export const BlogAboutSection = ({ blog }: BlogAboutSectionProps) => {
  const socialEntries = Object.entries((blog.social ?? {}) as Record<string, string>)
    .filter(([, v]) => typeof v === 'string' && v.trim().length > 0)
    .map(([key, value]) => [key, toHref(key, value)] as const)
    .filter((entry): entry is readonly [string, string] => entry[1] !== null)
  const websiteHref = safeExternalHref(blog.website)

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-neutral-800">
      <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-white">Acerca de este blog</h2>
      <p className="mb-6 whitespace-pre-wrap leading-relaxed text-neutral-600 dark:text-neutral-400">
        {blog.description}
      </p>

      {blog.stats.publishFrequency && (
        <div className="mb-4">
          <h3 className="mb-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">Frecuencia de Publicación</h3>
          <p className="text-neutral-900 dark:text-white">{blog.stats.publishFrequency}</p>
        </div>
      )}

      {websiteHref && (
        <div className="mb-4">
          <h3 className="mb-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">Sitio Web</h3>
          <a
            href={websiteHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary-600 hover:underline dark:text-primary-400"
          >
            <GlobeAltIcon className="h-4 w-4" />
            {blog.website}
          </a>
        </div>
      )}

      {socialEntries.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">Redes Sociales</h3>
          <div className="flex flex-wrap gap-2">
            {socialEntries.map(([key, href]) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-neutral-200 px-3 py-1 text-sm font-medium text-primary-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-primary-400 dark:hover:bg-neutral-700/50"
              >
                {SOCIAL_LABELS[key] ?? key}
              </a>
            ))}
          </div>
        </div>
      )}

      {blog.tags && blog.tags.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-neutral-500 dark:text-neutral-400">Temas</h3>
          <div className="flex flex-wrap gap-2">
            {blog.tags.map((tag, index) => (
              <span
                key={index}
                className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

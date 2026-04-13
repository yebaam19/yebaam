import { GlobeAltIcon } from '@/components/icons/heroicons-shim'
import type { Blog } from '../types/blog.types'

interface BlogAboutSectionProps {
  blog: Blog
}

export const BlogAboutSection = ({ blog }: BlogAboutSectionProps) => {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-neutral-800">
      <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-white">Acerca de este blog</h2>
      <p className="mb-6 leading-relaxed text-neutral-600 dark:text-neutral-400">{blog.description}</p>

      {blog.stats.publishFrequency && (
        <div className="mb-4">
          <h3 className="mb-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">Frecuencia de Publicación</h3>
          <p className="text-neutral-900 dark:text-white">{blog.stats.publishFrequency}</p>
        </div>
      )}

      {blog.website && (
        <div className="mb-4">
          <h3 className="mb-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">Sitio Web</h3>
          <a
            href={blog.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary-600 hover:underline dark:text-primary-400"
          >
            <GlobeAltIcon className="h-4 w-4" />
            {blog.website}
          </a>
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

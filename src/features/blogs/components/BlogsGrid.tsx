import { FC } from 'react'
import type { Blog } from '../types/blog.types'
import { BlogCard } from './BlogCard'

interface BlogsGridProps {
  blogs: Blog[]
  onFollow?: (blogId: string) => void
  onUnfollow?: (blogId: string) => void
  loadingBlogId?: string | null
  emptyMessage?: string
}

export const BlogsGrid: FC<BlogsGridProps> = ({
  blogs,
  onFollow,
  onUnfollow,
  loadingBlogId,
  emptyMessage = 'No se encontraron blogs',
}) => {
  if (blogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center">
          <svg
            className="mx-auto mb-4 h-24 w-24 text-neutral-300 dark:text-neutral-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
          <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">{emptyMessage}</h3>
          <p className="max-w-md text-neutral-600 dark:text-neutral-400">
            Explora diferentes categorías o busca blogs específicos
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {blogs.map((blog) => (
        <BlogCard
          key={blog.id}
          blog={blog}
          onFollow={onFollow}
          onUnfollow={onUnfollow}
          isLoading={loadingBlogId === blog.id}
        />
      ))}
    </div>
  )
}

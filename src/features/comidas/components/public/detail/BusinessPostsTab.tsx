'use client'

import { cfImageUrl } from '@/lib/cloudflare'
import type { Post } from '../../../types'
import { BusinessSocialFeed } from './BusinessSocialFeed'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

interface Props {
  posts: Post[]
  businessName: string
  businessId: string
  onSocialCountLoaded?: (n: number) => void
}

export function BusinessPostsTab({ posts, businessId, onSocialCountLoaded }: Props) {
  const published = posts
    .filter((p) => p.status === 'PUBLISHED')
    .sort((a, b) => {
      const da = a.published_at ?? a.created_at
      const db = b.published_at ?? b.created_at
      return new Date(db).getTime() - new Date(da).getTime()
    })

  return (
    <div className="space-y-10">
      {/* Social feed posts — shown first: most recent, dynamic content */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Publicaciones
        </h2>
        <BusinessSocialFeed businessId={businessId} onCountLoaded={onSocialCountLoaded} />
      </section>

      {/* CMS articles — below social feed */}
      {published.length > 0 && (
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Artículos
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {published.map((post) => {
              const cover = cfImageUrl(post.cover_cf_image_id, 'thumbnail')
              const date = post.published_at ? formatDate(post.published_at) : null

              return (
                <article
                  key={post.id}
                  className="overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-video overflow-hidden bg-neutral-100">
                    {cover ? (
                      <img
                        src={cover}
                        alt={post.title}
                        className="h-full w-full object-cover transition duration-500 hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary-50">
                        <span className="text-2xl font-black text-primary-700">
                          {post.title.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 p-4">
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <span className="font-semibold uppercase tracking-[0.16em]">Actualización</span>
                      {date && (
                        <>
                          <span>·</span>
                          <span>{date}</span>
                        </>
                      )}
                    </div>
                    <h3 className="text-base font-semibold leading-snug text-neutral-950">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="line-clamp-3 text-sm leading-6 text-neutral-600">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

'use client';

import { useState, useTransition } from 'react';
import { deleteMusicClubPost } from '../../../actions/music-posts.actions';
import { deleteMusicArticle } from '../../../actions/music-articles.actions';

interface PostRow {
  id: string;
  club_id: string;
  club_name: string;
  club_slug: string;
  author_id: string;
  author_name: string | null;
  title: string | null;
  body: string | null;
  created_at: string;
}

interface ArticleRow {
  id: string;
  slug: string;
  club_id: string;
  club_name: string;
  club_slug: string;
  author_id: string;
  author_name: string | null;
  title: string;
  published_at: string | null;
  created_at: string;
}

interface Props {
  posts: PostRow[];
  articles: ArticleRow[];
}

/** Cross-club moderation. Lists posts + articles with one-click delete. */
export function AdminClubModerationDrawer({ posts: initialPosts, articles: initialArticles }: Props) {
  const [posts, setPosts] = useState(initialPosts);
  const [articles, setArticles] = useState(initialArticles);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function removePost(id: string) {
    if (!confirm('¿Eliminar publicación?')) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteMusicClubPost(id);
      if (!res.ok) setError(res.error);
      else setPosts((prev) => prev.filter((p) => p.id !== id));
    });
  }
  function removeArticle(id: string) {
    if (!confirm('¿Eliminar artículo?')) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteMusicArticle(id);
      if (!res.ok) setError(res.error);
      else setArticles((prev) => prev.filter((a) => a.id !== id));
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Publicaciones recientes ({posts.length})
        </h3>
        {posts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
            Sin publicaciones recientes.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {posts.map((p) => (
              <li key={p.id} className="flex items-start gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-500">
                    {p.club_name} · {p.author_name ?? 'Miembro'} · {formatDate(p.created_at)}
                  </p>
                  {p.title && <p className="mt-1 text-sm font-semibold">{p.title}</p>}
                  {p.body && (
                    <p className="mt-1 line-clamp-3 text-sm text-zinc-700 dark:text-zinc-300">
                      {p.body}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removePost(p.id)}
                  disabled={pending}
                  className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-40 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Artículos recientes ({articles.length})
        </h3>
        {articles.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
            Sin artículos recientes.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {articles.map((a) => (
              <li key={a.id} className="flex items-start gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-500">
                    {a.club_name} · {a.author_name ?? 'Autor'} ·{' '}
                    {a.published_at ? `Publicado ${formatDate(a.published_at)}` : 'Borrador'}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{a.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeArticle(a.id)}
                  disabled={pending}
                  className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-40 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}

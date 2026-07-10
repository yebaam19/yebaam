'use client';

import { FC, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { NewspaperIcon, PlusIcon, TrashIcon } from '@/components/icons/heroicons-shim';
import { useFetch } from '@/lib/hooks/useFetch';
import { getAxiosInstance } from '@/lib/http/legacy-client';
import { invalidate } from '@/lib/hooks/cacheStore';
import type { Page } from '../../types/page.types';

interface PageArticle {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  publishedAt: string | null;
  author: { name: string; username: string | null; avatarUrl: string | null } | null;
}

interface PageDetailArticlesProps {
  page: Page;
  isOwner: boolean;
}

export const PageDetailArticles: FC<PageDetailArticlesProps> = ({ page, isOwner }) => {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useFetch(
    ['page-articles', page.id],
    async () => {
      const axios = getAxiosInstance();
      const { data: res } = await axios.get<PageArticle[]>(`/api/pages/${page.id}/articles`);
      return res;
    },
    { enabled: !!page.id }
  );

  const articles = data ?? [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const axios = getAxiosInstance();
      await axios.post(`/api/pages/${page.id}/articles`, {
        title: title.trim(),
        description: description.trim() || null,
        body: body.trim() || null,
        publish: true,
      });
      invalidate('page-articles');
      setTitle('');
      setDescription('');
      setBody('');
      setAdding(false);
      toast.success('Artículo publicado');
    } catch {
      toast.error('No se pudo publicar el artículo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const axios = getAxiosInstance();
      await axios.delete(`/api/pages/${page.id}/articles`, { params: { id } });
      invalidate('page-articles');
      toast.success('Artículo eliminado');
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <NewspaperIcon className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Artículos</h3>
          {!isLoading && (
            <span className="text-sm text-gray-500">({articles.length})</span>
          )}
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" />
            Nuevo
          </button>
        )}
      </div>

      {adding && (
        <form
          onSubmit={handleAdd}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-3"
        >
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción corta"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Contenido"
            rows={5}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Publicando…' : 'Publicar'}
          </button>
        </form>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && articles.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isOwner
              ? 'Publica el primer artículo del blog de la página.'
              : 'Esta página todavía no ha publicado artículos.'}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {articles.map((a) => (
          <article
            key={a.id}
            className="flex gap-4 rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm"
          >
            {a.coverUrl && (
              <div className="relative w-24 h-24 shrink-0 overflow-hidden rounded-md">
                <Image src={a.coverUrl} alt="" fill className="object-cover" sizes="96px" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white">{a.title}</h4>
              {a.description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {a.description}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                {a.author?.name ?? 'Autor'}
                {a.publishedAt
                  ? ` · ${new Date(a.publishedAt).toLocaleDateString('es')}`
                  : ' · Borrador'}
              </p>
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => handleDelete(a.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 self-start"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
};

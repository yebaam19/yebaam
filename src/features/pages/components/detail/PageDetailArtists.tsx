'use client';

import { FC, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { toast } from 'sonner';
import { StarIcon, PlusIcon, TrashIcon } from '@/components/icons/heroicons-shim';
import { useFetch } from '@/lib/hooks/useFetch';
import { getAxiosInstance } from '@/lib/http/legacy-client';
import { invalidate } from '@/lib/hooks/cacheStore';
import type { Page } from '../../types/page.types';

interface PageArtist {
  id: string;
  displayName: string;
  description: string | null;
  photoUrl: string | null;
  username: string | null;
  blogId: string | null;
}

interface PageDetailArtistsProps {
  page: Page;
  isOwner: boolean;
}

export const PageDetailArtists: FC<PageDetailArtistsProps> = ({ page, isOwner }) => {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useFetch(
    ['page-artists', page.id],
    async () => {
      const axios = getAxiosInstance();
      const { data: res } = await axios.get<PageArtist[]>(`/api/pages/${page.id}/artists`);
      return res;
    },
    { enabled: !!page.id }
  );

  const artists = data ?? [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const axios = getAxiosInstance();
      await axios.post(`/api/pages/${page.id}/artists`, {
        displayName: name.trim(),
        description: description.trim() || null,
      });
      invalidate('page-artists');
      setName('');
      setDescription('');
      setAdding(false);
      toast.success('Artista agregado');
    } catch {
      toast.error('No se pudo agregar el artista');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const axios = getAxiosInstance();
      await axios.delete(`/api/pages/${page.id}/artists`, { params: { id } });
      invalidate('page-artists');
      toast.success('Artista eliminado');
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StarIcon className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Artistas</h3>
          {!isLoading && (
            <span className="text-sm text-gray-500">({artists.length})</span>
          )}
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" />
            Agregar
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del artista"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción / presentación"
            rows={3}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </form>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && artists.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isOwner
              ? 'Aún no has asociado artistas a esta página.'
              : 'Esta página todavía no tiene artistas asociados.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {artists.map((a) => {
          const body = (
            <>
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                {a.photoUrl ? (
                  <Image src={a.photoUrl} alt="" width={56} height={56} className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-400">
                    {a.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                  {a.displayName}
                </p>
                {a.description && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {a.description}
                  </p>
                )}
              </div>
            </>
          );

          return (
            <div
              key={a.id}
              className="flex items-start gap-3 rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm"
            >
              {a.username ? (
                <Link
                  href={`/${a.username}` as Route}
                  className="flex flex-1 items-start gap-3 min-w-0 hover:opacity-90"
                >
                  {body}
                </Link>
              ) : (
                <div className="flex flex-1 items-start gap-3 min-w-0">{body}</div>
              )}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600"
                  title="Eliminar"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

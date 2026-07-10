'use client';

import { FC, useState } from 'react';
import { toast } from 'sonner';
import { useFetch } from '@/lib/hooks/useFetch';
import { getAxiosInstance } from '@/lib/http/legacy-client';
import { invalidate } from '@/lib/hooks/cacheStore';
import { CheckCircleIcon, ChevronDownIcon, ChevronUpIcon, TrashIcon } from '@/components/icons/heroicons-shim';
import type { Page } from '../../../../types/page.types';
import { AuditionApplications } from './AuditionApplications';

interface Props {
  page: Page;
  isOwner: boolean;
}

interface Audition {
  id: string;
  title: string;
  city: string | null;
  description: string | null;
  requirements: string | null;
  startsAt: string | null;
  viewerApplied: boolean;
}

export const PageAuditionsPanel: FC<Props> = ({ page, isOwner }) => {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [startsAt, setStartsAt] = useState('');
  /** id de la audición cuyo listado de postulaciones está abierto (propietario). */
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useFetch(
    ['page-auditions', page.id],
    async () => {
      const axios = getAxiosInstance();
      const { data: res } = await axios.get(`/api/pages/${page.id}/auditions`);
      return res as Audition[];
    },
    { enabled: !!page.id }
  );

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const axios = getAxiosInstance();
      await axios.post(`/api/pages/${page.id}/auditions`, {
        title,
        city: city || null,
        description: description || null,
        requirements: requirements || null,
        startsAt: startsAt || null,
      });
      invalidate('page-auditions');
      setAdding(false);
      setTitle('');
      toast.success('Audición publicada');
    } catch {
      toast.error('No se pudo crear');
    }
  };

  const apply = async (auditionId: string) => {
    try {
      const axios = getAxiosInstance();
      const { data: res } = await axios.post(`/api/pages/${page.id}/auditions`, {
        auditionId,
        apply: true,
      });
      invalidate('page-auditions');
      toast.success(
        (res as { alreadyApplied?: boolean })?.alreadyApplied
          ? 'Ya te habías postulado a esta audición'
          : 'Postulación enviada'
      );
    } catch {
      toast.error('No se pudo postular');
    }
  };

  const remove = async (auditionId: string) => {
    try {
      const axios = getAxiosInstance();
      await axios.delete(`/api/pages/${page.id}/auditions`, { params: { id: auditionId } });
      invalidate('page-auditions');
      toast.success('Audición eliminada');
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Audiciones</h2>
        {isOwner && (
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white"
          >
            Nueva
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={create} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-2">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ciudad" className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
          <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción" rows={2} className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
          <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Requisitos" rows={2} className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">Publicar</button>
        </form>
      )}

      {isLoading && <div className="h-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />}

      {(data ?? []).length === 0 && !isLoading && (
        <p className="text-sm text-gray-500">No hay audiciones abiertas.</p>
      )}

      <div className="space-y-3">
        {(data ?? []).map((a) => (
          <div key={a.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">{a.title}</h3>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  title="Eliminar audición"
                  className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            {a.city && <p className="text-xs text-gray-500 mt-1">{a.city}</p>}
            {a.startsAt && (
              <p className="text-xs text-gray-500">
                {new Date(a.startsAt).toLocaleString('es')}
              </p>
            )}
            {a.description && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{a.description}</p>
            )}
            {a.requirements && (
              <p className="mt-1 text-xs text-gray-500">Requisitos: {a.requirements}</p>
            )}
            {!isOwner &&
              (a.viewerApplied ? (
                <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-green-600">
                  <CheckCircleIcon className="w-4 h-4" />
                  Ya te postulaste
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => apply(a.id)}
                  className="mt-3 text-sm font-medium text-blue-600 hover:underline"
                >
                  Postularme
                </button>
              ))}
            {isOwner && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setExpandedId((prev) => (prev === a.id ? null : a.id))}
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                >
                  {expandedId === a.id ? (
                    <ChevronUpIcon className="w-4 h-4" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4" />
                  )}
                  Ver postulaciones
                </button>
                {expandedId === a.id && (
                  <AuditionApplications pageId={page.id} auditionId={a.id} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

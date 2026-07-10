'use client';

import { FC, useState } from 'react';
import { toast } from 'sonner';
import { useFetch } from '@/lib/hooks/useFetch';
import { getAxiosInstance } from '@/lib/http/legacy-client';
import { invalidate } from '@/lib/hooks/cacheStore';
import { TrashIcon } from '@/components/icons/heroicons-shim';
import type { Page } from '../../../../types/page.types';

interface Props {
  page: Page;
  isOwner: boolean;
}

export const PageEventsPanel: FC<Props> = ({ page, isOwner }) => {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [place, setPlace] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const [description, setDescription] = useState('');

  const { data, isLoading } = useFetch(
    ['page-events', page.id],
    async () => {
      const axios = getAxiosInstance();
      const { data: res } = await axios.get(`/api/pages/${page.id}/events`);
      return res as Array<{
        id: string;
        title: string;
        description: string | null;
        startsAt: string;
        place: string | null;
        mapUrl: string | null;
        ticketUrl: string | null;
        goingCount: number;
        myRsvp: string | null;
      }>;
    },
    { enabled: !!page.id }
  );

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const axios = getAxiosInstance();
      await axios.post(`/api/pages/${page.id}/events`, {
        title,
        startsAt: new Date(startsAt).toISOString(),
        place: place || null,
        ticketUrl: ticketUrl || null,
        description: description || null,
      });
      invalidate('page-events');
      setAdding(false);
      toast.success('Evento creado');
    } catch {
      toast.error('No se pudo crear el evento');
    }
  };

  const rsvp = async (eventId: string) => {
    try {
      const axios = getAxiosInstance();
      await axios.post(`/api/pages/${page.id}/events`, { eventId, rsvp: 'going' });
      invalidate('page-events');
      toast.success('Asistencia confirmada');
    } catch {
      toast.error('No se pudo confirmar');
    }
  };

  const remove = async (eventId: string) => {
    try {
      const axios = getAxiosInstance();
      await axios.delete(`/api/pages/${page.id}/events`, { params: { id: eventId } });
      invalidate('page-events');
      toast.success('Evento eliminado');
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Eventos</h2>
        {isOwner && (
          <button type="button" onClick={() => setAdding((v) => !v)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white">
            Nuevo
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={create} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-2">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
          <input required type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
          <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Lugar" className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
          <input value={ticketUrl} onChange={(e) => setTicketUrl(e.target.value)} placeholder="URL de boletos" className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción" rows={2} className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">Publicar</button>
        </form>
      )}

      {isLoading && <div className="h-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />}

      {(data ?? []).length === 0 && !isLoading && (
        <p className="text-sm text-gray-500">No hay eventos programados.</p>
      )}

      <div className="space-y-3">
        {(data ?? []).map((ev) => (
          <div key={ev.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">{ev.title}</h3>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => remove(ev.id)}
                  title="Eliminar evento"
                  className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(ev.startsAt).toLocaleString('es')}
              {ev.place ? ` · ${ev.place}` : ''}
            </p>
            {ev.description && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{ev.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="text-gray-500">{ev.goingCount} asistirán</span>
              {ev.ticketUrl && (
                <a href={ev.ticketUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Boletos
                </a>
              )}
              {ev.mapUrl && (
                <a href={ev.mapUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Mapa
                </a>
              )}
              <button type="button" onClick={() => rsvp(ev.id)} className="font-medium text-blue-600 hover:underline">
                {ev.myRsvp === 'going' ? 'Asistencia confirmada' : 'Confirmar asistencia'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

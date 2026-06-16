import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import type { SchoolEvent } from '../types';

export interface EventAdminPayload {
  schoolId?: string;
  title: string;
  description: string;
  eventType: string;
  imageUrl?: string | null;
  startsAt: string;
  endsAt: string;
  location: string;
}

export function useEventsAdmin() {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(() => {
    setLoading(true);
    api.get<{ ok: boolean; data: SchoolEvent[] }>('/events/admin')
      .then((response) => {
        setEvents(response.data.data);
        setError(null);
      })
      .catch((err: { message?: string }) => setError(err.message ?? 'Error al cargar eventos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = useCallback(async (payload: EventAdminPayload) => {
    await api.post('/events', payload);
    fetchEvents();
  }, [fetchEvents]);

  const updateEvent = useCallback(async (id: string, payload: Partial<EventAdminPayload>) => {
    await api.patch(`/events/${id}`, payload);
    fetchEvents();
  }, [fetchEvents]);

  const archiveEvent = useCallback(async (id: string) => {
    await api.patch(`/events/${id}/archive`);
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents, createEvent, updateEvent, archiveEvent };
}

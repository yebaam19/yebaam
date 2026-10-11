import type { TimelineCursor, TimelinePage } from '../interfaces/timeline.interfaces';

export async function fetchTimelinePage(cursor: TimelineCursor | null, signal: AbortSignal): Promise<TimelinePage> {
  const params = new URLSearchParams();
  if (cursor) {
    params.set('before', cursor.createdAt);
    params.set('beforeId', cursor.id);
  }
  const response = await fetch(`/api/posts/timeline?${params}`, { signal, cache: 'no-store' });
  if (!response.ok) throw new Error('No se pudieron cargar las publicaciones.');
  return response.json();
}

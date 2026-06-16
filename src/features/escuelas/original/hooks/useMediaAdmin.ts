import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import type { MediaAsset, MediaType } from '../types';

export interface MediaAdminPayload {
  schoolId?: string;
  programId?: string;
  instructorId?: string;
  campaignId?: string;
  eventId?: string;
  articleId?: string;
  relatedType?: string | null;
  relatedId?: string | null;
  type: MediaType;
  url: string;
  thumbnailUrl?: string | null;
  title?: string | null;
  description?: string | null;
  caption?: string | null;
  provider?: string | null;
  isPrimary?: boolean;
}

export interface MediaUpdatePayload {
  title?: string | null;
  description?: string | null;
  caption?: string | null;
  thumbnailUrl?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
  isActive?: boolean;
}

export function useMediaAdmin() {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedia = useCallback(() => {
    setLoading(true);
    api.get<{ ok: boolean; data: MediaAsset[] }>('/media?includeInactive=true')
      .then((response) => {
        setMedia(response.data.data);
        setError(null);
      })
      .catch((err: { message?: string }) => setError(err.message ?? 'Error al cargar fotos y reels'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  const createExternalMedia = useCallback(async (payload: MediaAdminPayload) => {
    await api.post('/media/external', payload);
    fetchMedia();
  }, [fetchMedia]);

  const updateMedia = useCallback(async (id: string, payload: MediaUpdatePayload) => {
    await api.patch(`/media/${id}`, payload);
    fetchMedia();
  }, [fetchMedia]);

  const setPrimary = useCallback(async (id: string) => {
    await api.patch(`/media/${id}/primary`);
    fetchMedia();
  }, [fetchMedia]);

  const deactivateMedia = useCallback(async (id: string) => {
    await api.patch(`/media/${id}/deactivate`);
    fetchMedia();
  }, [fetchMedia]);

  return {
    media,
    loading,
    error,
    refetch: fetchMedia,
    createExternalMedia,
    updateMedia,
    setPrimary,
    deactivateMedia,
  };
}

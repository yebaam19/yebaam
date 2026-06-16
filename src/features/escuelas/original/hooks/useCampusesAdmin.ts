import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import type { Campus } from '../types';

export interface CampusAdminPayload {
  schoolId?: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  latitude?: number | null;
  longitude?: number | null;
  isActive?: boolean;
}

export function useCampusesAdmin() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampuses = useCallback(() => {
    setLoading(true);
    api.get<{ ok: boolean; data: Campus[] }>('/campuses/admin')
      .then((response) => {
        setCampuses(response.data.data);
        setError(null);
      })
      .catch((err: { message?: string }) => setError(err.message ?? 'Error al cargar sedes'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCampuses(); }, [fetchCampuses]);

  const createCampus = useCallback(async (payload: CampusAdminPayload) => {
    await api.post('/campuses', payload);
    fetchCampuses();
  }, [fetchCampuses]);

  const updateCampus = useCallback(async (id: string, payload: CampusAdminPayload) => {
    await api.patch(`/campuses/${id}`, payload);
    fetchCampuses();
  }, [fetchCampuses]);

  const deactivateCampus = useCallback(async (id: string) => {
    await api.patch(`/campuses/${id}/deactivate`);
    fetchCampuses();
  }, [fetchCampuses]);

  return { campuses, loading, error, refetch: fetchCampuses, createCampus, updateCampus, deactivateCampus };
}

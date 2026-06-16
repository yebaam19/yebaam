import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import type { TrialClass, TrialStatus } from '../types';

export function useTrialClasses() {
  const [trials, setTrials] = useState<TrialClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrials = useCallback(() => {
    setLoading(true);
    api
      .get<{ ok: boolean; data: TrialClass[] }>('/trial-classes')
      .then((r) => {
        setTrials(r.data.data);
        setError(null);
      })
      .catch((err: { message?: string }) => setError(err.message ?? 'Error al cargar clases de prueba'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchTrials();
  }, [fetchTrials]);

  const updateStatus = useCallback(async (id: string, status: TrialStatus) => {
    await api.patch(`/trial-classes/${id}/status`, { status });
    setTrials((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }, []);

  return { trials, loading, error, refetch: fetchTrials, updateStatus };
}

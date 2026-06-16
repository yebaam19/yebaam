import { useEffect, useState } from 'react';
import api from '../lib/api';
import type { AdminStats } from '../types';

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ ok: boolean; data: AdminStats }>('/admin/stats')
      .then((r) => {
        setStats(r.data.data);
        setError(null);
      })
      .catch((err: { message?: string }) => setError(err.message ?? 'Error al cargar métricas'))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading, error };
}

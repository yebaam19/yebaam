import { useEffect, useState } from 'react';
import api from '../lib/api';
import type { ProgramListResponse } from '../types';

export interface ProgramFilters {
  schoolId?: string;
  disciplineId?: string;
  level?: string;
  modality?: string;
  trialClassAvailable?: boolean;
  search?: string;
  page: number;
  limit: number;
}

export function usePrograms(filters: ProgramFilters) {
  const [result, setResult] = useState<ProgramListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { schoolId, disciplineId, level, modality, trialClassAvailable, search, page, limit } = filters;

  useEffect(() => {
    const params = new URLSearchParams();
    if (schoolId) params.set('schoolId', schoolId);
    if (disciplineId) params.set('disciplineId', disciplineId);
    if (level) params.set('level', level);
    if (modality) params.set('modality', modality);
    if (trialClassAvailable !== undefined) params.set('trialClassAvailable', String(trialClassAvailable));
    params.set('page', String(page));
    params.set('limit', String(limit));

    const delay = search !== undefined && search !== '' ? 400 : 0;
    if (search) params.set('search', search);

    setLoading(true);
    const timer = setTimeout(() => {
      api
        .get<{ ok: boolean; data: ProgramListResponse }>(`/programs?${params.toString()}`)
        .then((r) => {
          setResult(r.data.data);
          setError(null);
        })
        .catch((err: { message?: string }) => setError(err.message ?? 'Error al cargar programas'))
        .finally(() => setLoading(false));
    }, delay);

    return () => clearTimeout(timer);
  }, [schoolId, disciplineId, level, modality, trialClassAvailable, search, page, limit]);

  return { result, loading, error };
}

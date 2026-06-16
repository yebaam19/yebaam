import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export interface AdminSchoolOption {
  id: string;
  name: string;
  slug: string;
  city: string;
  category: string;
  schoolType: string;
  isActive: boolean;
  isVerified: boolean;
}

export function useAdminSchools() {
  const { user } = useAuth();
  const [schools, setSchools] = useState<AdminSchoolOption[]>([]);
  const [loading, setLoading] = useState(user?.role === 'PLATFORM_ADMIN');
  const [error, setError] = useState<string | null>(null);

  const fetchSchools = useCallback(() => {
    if (user?.role !== 'PLATFORM_ADMIN') {
      setSchools([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    api.get<{ ok: boolean; data: AdminSchoolOption[] }>('/schools/admin')
      .then((response) => {
        setSchools(response.data.data);
        setError(null);
      })
      .catch((err: { message?: string }) => setError(err.message ?? 'Error al cargar escuelas'))
      .finally(() => setLoading(false));
  }, [user?.role]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  return { schools, loading, error, refetch: fetchSchools };
}

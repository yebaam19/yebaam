import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';

export interface AdminInstructor {
  id: string;
  name: string;
  bio: string;
  specialties: string;
  experience?: string | null;
  education?: string | null;
  photoUrl?: string | null;
  instagram?: string | null;
  portfolioUrl?: string | null;
  isActive: boolean;
  schoolId: string;
  school?: { id: string; name: string } | null;
}

export interface InstructorAdminPayload {
  schoolId?: string;
  name: string;
  bio: string;
  specialties: string;
  experience?: string | null;
  education?: string | null;
  photoUrl?: string | null;
  instagram?: string | null;
  portfolioUrl?: string | null;
}

export function useInstructorsAdmin() {
  const [instructors, setInstructors] = useState<AdminInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstructors = useCallback(() => {
    setLoading(true);
    api
      .get<{ ok: boolean; data: AdminInstructor[] }>('/instructors/admin')
      .then((r) => { setInstructors(r.data.data); setError(null); })
      .catch((err: { message?: string }) => setError(err.message ?? 'Error al cargar instructores'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchInstructors(); }, [fetchInstructors]);

  const createInstructor = useCallback(async (payload: InstructorAdminPayload) => {
    await api.post('/instructors', payload);
    fetchInstructors();
  }, [fetchInstructors]);

  const updateInstructor = useCallback(async (id: string, payload: InstructorAdminPayload) => {
    await api.patch(`/instructors/${id}`, payload);
    fetchInstructors();
  }, [fetchInstructors]);

  const deactivateInstructor = useCallback(async (id: string) => {
    await api.patch(`/instructors/${id}/deactivate`);
    fetchInstructors();
  }, [fetchInstructors]);

  return {
    instructors,
    loading,
    error,
    refetch: fetchInstructors,
    createInstructor,
    updateInstructor,
    deactivateInstructor,
  };
}

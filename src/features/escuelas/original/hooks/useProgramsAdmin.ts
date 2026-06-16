import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';

export interface AdminProgram {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  modality: string;
  level: string;
  programType: string;
  ageRange: string;
  duration: string;
  scheduleSummary: string;
  monthlyPrice: number | null;
  registrationFee: number | null;
  currency: string;
  imageUrl?: string | null;
  enrollmentOpen: boolean;
  isActive: boolean;
  trialClassAvailable: boolean;
  isFeatured: boolean;
  schoolId: string;
  disciplineId: string;
  campusId?: string | null;
  instructorId?: string | null;
  materialsIncluded: boolean;
  sortOrder: number;
  discipline?: { id: string; name: string } | null;
  school?: { id: string; name: string; slug: string } | null;
}

export interface Discipline {
  id: string;
  name: string;
  slug: string;
}

export interface AdminCampusOption {
  id: string;
  schoolId: string;
  name: string;
  city: string;
  address: string;
  isActive: boolean;
}

export interface AdminInstructorOption {
  id: string;
  schoolId: string;
  name: string;
  isActive: boolean;
}

interface AdminProgramsPage {
  data: AdminProgram[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProgramAdminPayload {
  schoolId?: string;
  name: string;
  disciplineId: string;
  campusId?: string;
  instructorId?: string;
  modality: string;
  level: string;
  programType?: string;
  shortDescription: string;
  description: string;
  monthlyPrice?: number;
  registrationFee?: number;
  currency: string;
  ageRange?: string;
  duration?: string;
  scheduleSummary?: string;
  imageUrl?: string;
  trialClassAvailable: boolean;
  enrollmentOpen: boolean;
  materialsIncluded?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
}

export function useProgramsAdmin() {
  const [programs, setPrograms] = useState<AdminProgram[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [campuses, setCampuses] = useState<AdminCampusOption[]>([]);
  const [instructors, setInstructors] = useState<AdminInstructorOption[]>([]);
  const [pagination, setPagination] = useState<AdminProgramsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrograms = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<{ ok: boolean; data: AdminProgramsPage }>('/programs/admin?limit=100'),
      api.get<{ ok: boolean; data: Discipline[] }>('/disciplines'),
      api.get<{ ok: boolean; data: AdminCampusOption[] }>('/campuses/admin'),
      api.get<{ ok: boolean; data: AdminInstructorOption[] }>('/instructors/admin'),
    ])
      .then(([pr, dr, cr, ir]) => {
        setPrograms(pr.data.data.data);
        setPagination(pr.data.data);
        setDisciplines(dr.data.data);
        setCampuses(cr.data.data);
        setInstructors(ir.data.data.filter((instructor) => instructor.isActive));
        setError(null);
      })
      .catch((err: { message?: string }) => setError(err.message ?? 'Error al cargar programas'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  const createProgram = useCallback(async (payload: ProgramAdminPayload) => {
    await api.post('/programs', payload);
    fetchPrograms();
  }, [fetchPrograms]);

  const updateProgram = useCallback(async (id: string, payload: ProgramAdminPayload) => {
    await api.patch(`/programs/${id}`, payload);
    fetchPrograms();
  }, [fetchPrograms]);

  const deactivateProgram = useCallback(async (id: string) => {
    await api.patch(`/programs/${id}/deactivate`);
    fetchPrograms();
  }, [fetchPrograms]);

  return {
    programs,
    disciplines,
    campuses,
    instructors,
    pagination,
    loading,
    error,
    refetch: fetchPrograms,
    createProgram,
    updateProgram,
    deactivateProgram,
  };
}

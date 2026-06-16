import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import type { Campus, ScheduleSlot } from '../types';
import type { AdminProgram } from './useProgramsAdmin';

export interface ScheduleAdminPayload {
  programId: string;
  campusId?: string | null;
  weekday: number;
  startsAt: string;
  endsAt: string;
  capacity: number;
  isActive?: boolean;
}

export function useSchedulesAdmin() {
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [programs, setPrograms] = useState<AdminProgram[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<{ ok: boolean; data: ScheduleSlot[] }>('/schedules/admin'),
      api.get<{ ok: boolean; data: { data: AdminProgram[] } }>('/programs/admin?limit=100'),
      api.get<{ ok: boolean; data: Campus[] }>('/campuses/admin'),
    ])
      .then(([schedulesResponse, programsResponse, campusesResponse]) => {
        setSchedules(schedulesResponse.data.data);
        setPrograms(programsResponse.data.data.data.filter((program) => program.isActive));
        setCampuses(campusesResponse.data.data.filter((campus) => campus.isActive));
        setError(null);
      })
      .catch((err: { message?: string }) => setError(err.message ?? 'Error al cargar horarios'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const createSchedule = useCallback(async (payload: ScheduleAdminPayload) => {
    await api.post('/schedules', payload);
    fetchSchedules();
  }, [fetchSchedules]);

  const updateSchedule = useCallback(async (id: string, payload: ScheduleAdminPayload) => {
    await api.patch(`/schedules/${id}`, payload);
    fetchSchedules();
  }, [fetchSchedules]);

  const deactivateSchedule = useCallback(async (id: string) => {
    await api.patch(`/schedules/${id}/deactivate`);
    fetchSchedules();
  }, [fetchSchedules]);

  return {
    schedules,
    programs,
    campuses,
    loading,
    error,
    refetch: fetchSchedules,
    createSchedule,
    updateSchedule,
    deactivateSchedule,
  };
}

import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import type { EnrollmentLead, LeadStatus } from '../types';

export function useLeads() {
  const [leads, setLeads] = useState<EnrollmentLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(() => {
    setLoading(true);
    api
      .get<{ ok: boolean; data: EnrollmentLead[] }>('/leads')
      .then((r) => {
        setLeads(r.data.data);
        setError(null);
      })
      .catch((err: { message?: string }) => setError(err.message ?? 'Error al cargar leads'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateStatus = useCallback(async (id: string, status: LeadStatus) => {
    await api.patch(`/leads/${id}/status`, { status });
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    );
  }, []);

  return { leads, loading, error, refetch: fetchLeads, updateStatus };
}

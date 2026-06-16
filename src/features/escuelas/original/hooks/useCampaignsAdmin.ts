import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import type { Campaign } from '../types';

export interface CampaignAdminPayload {
  schoolId?: string;
  title: string;
  campaignType: string;
  subtitle?: string | null;
  description: string;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  startsAt: string;
  endsAt: string;
}

export function useCampaignsAdmin() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(() => {
    setLoading(true);
    api.get<{ ok: boolean; data: Campaign[] }>('/campaigns/admin')
      .then((response) => {
        setCampaigns(response.data.data);
        setError(null);
      })
      .catch((err: { message?: string }) => setError(err.message ?? 'Error al cargar campañas'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = useCallback(async (payload: CampaignAdminPayload) => {
    await api.post('/campaigns', payload);
    fetchCampaigns();
  }, [fetchCampaigns]);

  const updateCampaign = useCallback(async (id: string, payload: Partial<CampaignAdminPayload>) => {
    await api.patch(`/campaigns/${id}`, payload);
    fetchCampaigns();
  }, [fetchCampaigns]);

  const archiveCampaign = useCallback(async (id: string) => {
    await api.patch(`/campaigns/${id}/archive`);
    fetchCampaigns();
  }, [fetchCampaigns]);

  return { campaigns, loading, error, refetch: fetchCampaigns, createCampaign, updateCampaign, archiveCampaign };
}

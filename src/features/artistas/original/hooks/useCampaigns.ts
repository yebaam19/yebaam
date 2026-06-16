import { useApiQuery } from "./useApiQuery";
import type { Campaign, Paginated } from "../types";

export function useCampaigns(query = "") {
  return useApiQuery<Paginated<Campaign>>(`/campaigns${query}`, [query]);
}

export function useCampaignDetail(slug: string) {
  return useApiQuery<Campaign>(`/campaigns/${slug}`, [slug]);
}

import { useApiQuery } from "./useApiQuery";
import type { Opportunity, Paginated } from "../types";

export function useOpportunities(query = "") {
  return useApiQuery<Paginated<Opportunity>>(`/opportunities${query}`, [query]);
}

export function useOpportunityDetail(slug: string) {
  return useApiQuery<Opportunity>(`/opportunities/${slug}`, [slug]);
}

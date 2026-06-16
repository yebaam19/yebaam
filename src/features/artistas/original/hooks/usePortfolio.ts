import { useApiQuery } from "./useApiQuery";
import type { Paginated, PortfolioItem } from "../types";

export function usePortfolio(search = "") {
  return useApiQuery<Paginated<PortfolioItem>>(`/portfolio${search}`, [search]);
}

export function useArtistPortfolio(artistId: string) {
  return useApiQuery<PortfolioItem[]>(`/artists/${artistId}/portfolio`, [artistId]);
}

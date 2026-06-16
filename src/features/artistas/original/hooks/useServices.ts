import { useApiQuery } from "./useApiQuery";
import type { ServiceOffer } from "../types";

export function useServices(artistId: string) {
  return useApiQuery<ServiceOffer[]>(`/artists/${artistId}/services`, [artistId]);
}

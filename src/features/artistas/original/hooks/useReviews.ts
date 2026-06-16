import { useApiQuery } from "./useApiQuery";
import type { Review } from "../types";

export function useReviews(artistId: string) {
  return useApiQuery<Review[]>(`/artists/${artistId}/reviews`, [artistId]);
}

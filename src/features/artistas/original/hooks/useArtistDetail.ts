import { useApiQuery } from "./useApiQuery";
import type { ArtistProfile } from "../types";

export function useArtistDetail(slug: string) {
  return useApiQuery<ArtistProfile>(`/artists/${slug}`, [slug]);
}

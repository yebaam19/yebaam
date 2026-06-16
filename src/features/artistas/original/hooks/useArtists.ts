import { useApiQuery } from "./useApiQuery";
import type { ArtistProfile, Paginated } from "../types";

export function useArtists(query = "") {
  return useApiQuery<Paginated<ArtistProfile>>(`/artists${query}`, [query]);
}

import { useApiQuery } from "./useApiQuery";

export function useFavorites() {
  return useApiQuery<unknown[]>("/me/favorites", []);
}

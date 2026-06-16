import { useApiQuery } from "./useApiQuery";

export function useMedia() {
  return useApiQuery<unknown[]>("/media", []);
}

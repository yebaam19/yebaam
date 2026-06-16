import { useApiQuery } from "./useApiQuery";

export function useFollows() {
  return useApiQuery<unknown[]>("/me/follows", []);
}

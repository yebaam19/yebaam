import { useApiQuery } from "./useApiQuery";

export function useDashboard(path: string) {
  return useApiQuery<Record<string, unknown>>(path, [path]);
}

import { useApiQuery } from "./useApiQuery";

export function useRequests(path = "/admin/requests") {
  return useApiQuery<{ items: unknown[]; meta: unknown }>(path, [path]);
}

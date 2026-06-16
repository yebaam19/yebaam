import { useApiQuery } from "./useApiQuery";

export function useReports() {
  return useApiQuery<unknown[]>("/admin/reports", []);
}

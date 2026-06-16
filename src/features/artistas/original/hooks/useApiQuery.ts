import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { ApiResponse } from "../types";

export function useApiQuery<T>(path: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((activeRef?: { active: boolean }) => {
    setIsLoading(true);
    setError(null);

    return api
      .get<ApiResponse<T>>(path)
      .then((response) => {
        if (activeRef?.active === false) return;
        setData(response.data.data);
      })
      .catch((requestError: unknown) => {
        if (activeRef?.active === false) return;
        const maybeMessage =
          typeof requestError === "object" &&
          requestError !== null &&
          "response" in requestError &&
          typeof requestError.response === "object" &&
          requestError.response !== null &&
          "data" in requestError.response &&
          typeof requestError.response.data === "object" &&
          requestError.response.data !== null &&
          "message" in requestError.response.data &&
          typeof requestError.response.data.message === "string"
            ? requestError.response.data.message
            : null;

        setError(maybeMessage ?? "No se pudo cargar la informacion solicitada");
      })
      .finally(() => {
        if (activeRef?.active !== false) setIsLoading(false);
      });
  }, [path]);

  useEffect(() => {
    const activeRef = { active: true };
    void load(activeRef);

    return () => {
      activeRef.active = false;
    };
  }, [load, ...deps]);

  return { data, isLoading, error, refetch: () => load() };
}

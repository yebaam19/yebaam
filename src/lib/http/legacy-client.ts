/**
 * Drop-in replacement for the legacy axios-shaped client.
 *
 * Unlike `@/lib/legacy-api/client` (which is a stub that returns empty
 * data without calling anything), this shim actually performs the
 * request against our own Next.js Route Handlers under `src/app/api/**`.
 *
 * Services that still look like axios callers can import `getAxiosInstance`
 * from here and keep their code unchanged while data flows through the
 * proper `/api` route → Supabase SDK path.
 */

type StubResponse<T = any> = {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: { method: string; url: string; [key: string]: unknown };
  request: Record<string, unknown>;
};

type RequestConfig = {
  params?: Record<string, unknown> | URLSearchParams | object;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

const noopInterceptor = { use: () => 0, eject: () => undefined };

function buildUrl(url: string, config?: RequestConfig): string {
  if (!config?.params) return url;
  const qs =
    config.params instanceof URLSearchParams
      ? config.params.toString()
      : Object.entries(config.params as Record<string, unknown>)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(
            ([k, v]) =>
              `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
          )
          .join('&');
  if (!qs) return url;
  return url.includes('?') ? `${url}&${qs}` : `${url}?${qs}`;
}

async function doFetch<T>(
  method: string,
  url: string,
  body?: unknown,
  config?: RequestConfig
): Promise<StubResponse<T>> {
  const hasBody = body !== undefined && body !== null && method !== 'GET' && method !== 'HEAD';
  const init: RequestInit = {
    method,
    credentials: 'same-origin',
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(config?.headers ?? {}),
    },
    signal: config?.signal,
  };
  if (hasBody) init.body = JSON.stringify(body);

  const fullUrl = buildUrl(url, config);
  const response = await fetch(fullUrl, init);
  const text = await response.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const errorMessage =
      (data && typeof data === 'object' && 'error' in data
        ? String((data as { error: unknown }).error)
        : response.statusText) || `Request failed (${response.status})`;
    const err = new Error(errorMessage) as Error & {
      response?: {
        status: number;
        data: unknown;
      };
      isAxiosError: boolean;
    };
    err.response = { status: response.status, data };
    err.isAxiosError = true;
    throw err;
  }

  return {
    data: data as T,
    status: response.status,
    statusText: response.statusText,
    headers: {},
    config: { method, url: fullUrl },
    request: {},
  };
}

export interface LegacyClient {
  get<T = any>(url: string, config?: RequestConfig): Promise<StubResponse<T>>;
  head<T = any>(url: string, config?: RequestConfig): Promise<StubResponse<T>>;
  post<T = any>(url: string, data?: unknown, config?: RequestConfig): Promise<StubResponse<T>>;
  put<T = any>(url: string, data?: unknown, config?: RequestConfig): Promise<StubResponse<T>>;
  patch<T = any>(url: string, data?: unknown, config?: RequestConfig): Promise<StubResponse<T>>;
  delete<T = any>(url: string, config?: RequestConfig): Promise<StubResponse<T>>;
  defaults: { baseURL: string; headers: Record<string, string> };
  interceptors: {
    request: { use: () => number; eject: () => void };
    response: { use: () => number; eject: () => void };
  };
}

const client: LegacyClient = {
  get: (url, config) => doFetch('GET', url, undefined, config),
  head: (url, config) => doFetch('HEAD', url, undefined, config),
  post: (url, data, config) => doFetch('POST', url, data, config),
  put: (url, data, config) => doFetch('PUT', url, data, config),
  patch: (url, data, config) => doFetch('PATCH', url, data, config),
  delete: (url, config) => doFetch('DELETE', url, undefined, config),
  defaults: { baseURL: '', headers: {} },
  interceptors: { request: noopInterceptor, response: noopInterceptor },
};

export function getAxiosInstance(): LegacyClient {
  return client;
}

export function initAxios(_opts?: unknown): LegacyClient {
  return client;
}

export type TokenProvider = {
  getAccessToken?: () => string | null;
  getRefreshToken?: () => string | null;
  setTokens?: (access: string | null, refresh: string | null) => void;
};

export function setTokenProvider(_provider: TokenProvider): void {
  // no-op — session is managed by the httpOnly cookie on same-origin routes.
}

export function clearTokenProvider(): void {
  // no-op
}

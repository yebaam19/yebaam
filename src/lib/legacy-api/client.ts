/**
 * Legacy API stub client.
 *
 * Drop-in replacement for the old axios instance that used to talk to the
 * Express backend. Every feature that has not yet been migrated to
 * `@insforge/sdk` imports this module via `getAxiosInstance()`.
 *
 *   - GET / HEAD       → resolve with an empty wrapper shape so list
 *                         views render as empty state instead of crashing.
 *   - POST / PATCH /   → reject with a clear "not yet migrated" error so
 *     PUT / DELETE       UI writes surface a meaningful message.
 *
 * Zero runtime dependencies (no axios). Delete this module and all its
 * callers once every service is fully migrated to InsForge or to Next.js
 * Route Handlers / Server Actions.
 */

type StubResponse<T = unknown> = {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  config: { method: string; url: string; baseURL?: string; [key: string]: unknown }
  request: Record<string, unknown>
}

function makeEmptyResponse<T>(method: string, url: string): StubResponse<T> {
  return {
    data: [] as unknown as T,
    status: 200,
    statusText: 'OK (stub)',
    headers: {},
    config: { method, url },
    request: {},
  }
}

function makeStubError(method: string, url: string): Error {
  const err = new Error(
    `This action is not yet migrated to InsForge (${method.toUpperCase()} ${url}). ` +
      `Legacy axios has been removed — migrate the caller to @insforge/sdk or a Next.js Route Handler.`
  ) as Error & { isStub: boolean }
  err.isStub = true
  return err
}

function warnGet(method: string, url: string): void {
  if (typeof window !== 'undefined') {
    console.warn(
      `[legacy-api] ${method.toUpperCase()} ${url} — feature not yet migrated to InsForge. Returning empty data.`
    )
  }
}

export interface LegacyClient {
  get<T = unknown>(url: string, config?: unknown): Promise<StubResponse<T>>
  head<T = unknown>(url: string, config?: unknown): Promise<StubResponse<T>>
  post<T = unknown>(url: string, data?: unknown, config?: unknown): Promise<StubResponse<T>>
  put<T = unknown>(url: string, data?: unknown, config?: unknown): Promise<StubResponse<T>>
  patch<T = unknown>(url: string, data?: unknown, config?: unknown): Promise<StubResponse<T>>
  delete<T = unknown>(url: string, config?: unknown): Promise<StubResponse<T>>
  defaults: { baseURL: string; headers: Record<string, string> }
  interceptors: {
    request: { use: () => number; eject: () => void }
    response: { use: () => number; eject: () => void }
  }
}

const noopInterceptor = { use: () => 0, eject: () => undefined }

const client: LegacyClient = {
  get: (url) => {
    warnGet('get', url)
    return Promise.resolve(makeEmptyResponse('get', url))
  },
  head: (url) => {
    warnGet('head', url)
    return Promise.resolve(makeEmptyResponse('head', url))
  },
  post: (url) => Promise.reject(makeStubError('post', url)),
  put: (url) => Promise.reject(makeStubError('put', url)),
  patch: (url) => Promise.reject(makeStubError('patch', url)),
  delete: (url) => Promise.reject(makeStubError('delete', url)),
  defaults: { baseURL: '', headers: {} },
  interceptors: { request: noopInterceptor, response: noopInterceptor },
}

export function getAxiosInstance(): LegacyClient {
  return client
}

export function initAxios(_opts?: unknown): LegacyClient {
  return client
}

export type TokenProvider = {
  getAccessToken?: () => string | null
  getRefreshToken?: () => string | null
  setTokens?: (access: string | null, refresh: string | null) => void
}
export type InterceptorOptions = Record<string, unknown>

export function setTokenProvider(_p: TokenProvider): void {
  // no-op — InsForge SDK manages its own session cookies.
}
export function clearTokenProvider(): void {
  // no-op
}
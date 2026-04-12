
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

/**
 * Tipos para el proveedor de tokens.
 * - getAccessToken: función que retorna el access token actual (o null).
 * - getRefreshToken: función que retorna el refresh token actual (o null).
 * - setTokens: función opcional para actualizar tokens después del refresh.
 */
export type TokenProvider = {
  getAccessToken: () => string | null | Promise<string | null>
  getRefreshToken?: () => string | null | Promise<string | null>
  setTokens?: (accessToken: string | null, refreshToken?: string | null) => void | Promise<void>
}

/**
 * Opciones para configurar los interceptores.
 * - refreshEndpoint: ruta relativa o absoluta para solicitar refresh (POST).
 * - isRetryable: función que determina si un error debe intentar refresh (por defecto 401).
 * - onRefreshError: callback en caso de fallo del refresh (ej: logout).
 */
export type InterceptorOptions = {
  refreshEndpoint?: string
  isRetryable?: (error: AxiosError) => boolean
  onRefreshError?: (error: AxiosError) => void
}

let tokenProvider: TokenProvider | null = null

/**
 * Permite registrar un provider de tokens. Debe llamarse desde la inicialización
 * de la app (cliente o server) para que los interceptores puedan obtener tokens.
 *
 * Ejemplo:
 * setTokenProvider({
 *   getAccessToken: () => Cookies.get('accessToken') || null,
 *   getRefreshToken: () => Cookies.get('refreshToken') || null,
 *   setTokens: (a, r) => { Cookies.set('accessToken', a); Cookies.set('refreshToken', r); }
 * })
 */
export function setTokenProvider(provider: TokenProvider) {
  tokenProvider = provider
}

/**
 * Remueve el provider registrado.
 */
export function clearTokenProvider() {
  tokenProvider = null
}

/**
 * Configuración por defecto para los interceptores.
 */
const DEFAULT_OPTIONS: Required<InterceptorOptions> = {
  refreshEndpoint: '/auth/refresh',
  isRetryable: (error: AxiosError) => {
    // Solo reintentar si es exactamente 401 (Unauthorized)
    // NO reintentar en otros casos como:
    // - 429 (Too Many Requests) - rate limiting
    // - 400 (Bad Request) - datos inválidos
    // - 403 (Forbidden) - sin permisos
    // - 500 (Server Error) - error del servidor
    const status = error.response?.status
    console.log('[Interceptor] Error status:', status, '- Retryable:', status === 401)
    return status === 401
  },
  onRefreshError: () => {
    // Por defecto no hace nada. El caller puede proveer un onRefreshError para
    // redirigir al login, borrar tokens, etc.
  },
}

/**
 * setupInterceptors
 *
 * Registra interceptores de request y response sobre la instancia dada.
 *
 * - request interceptor: añade Authorization cuando hay accessToken.
 * - response interceptor: en caso de error 401 intenta refresh (una vez).
 *
 * Implementación del refresh:
 * - Si ya hay un refresh en curso, encola la petición y la reintenta cuando termine.
 * - Si no hay refresh en curso, inicia el refresh usando la instancia (POST al refreshEndpoint).
 *
 * Nota: para evitar bucles, los requests que llamen al refreshEndpoint no deben disparar otro refresh.
 */
export function setupInterceptors(instance: AxiosInstance, opts?: InterceptorOptions): void {

  const { refreshEndpoint, isRetryable, onRefreshError } = { ...DEFAULT_OPTIONS, ...opts }

  // Cola de promesas que esperan el resultado del refresh token
  let isRefreshing = false
  let failedQueue: Array<{
    resolve: (value?: AxiosResponse | Promise<AxiosResponse>) => void
    reject: (err: any) => void
    config: AxiosRequestConfig
  }> = []

  const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject, config }) => {
      if (error) {
        reject(error)
      } else {
        if (token && config.headers) {
          config.headers['Authorization'] = `Bearer ${token}`
        }
        resolve(instance.request(config))
      }
    })
    failedQueue = []
  }

  // Request interceptor: agrega Authorization si el provider está registrado
  instance.interceptors.request.use(
    async (config) => {
      try {
        if (!tokenProvider) return config
        const accessToken = await tokenProvider.getAccessToken()
        if (accessToken && config.headers) {
          config.headers['Authorization'] = `Bearer ${accessToken}`
        }
      } catch (err) {
        // no bloquear la request por error al obtener token
        // console.warn('Error obteniendo access token en interceptor request', err)
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // Response interceptor: maneja refresh token en caso de 401 (o según isRetryable)
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config
      const status = error.response?.status

      console.log('[Interceptor] Response error:', {
        url: originalRequest?.url,
        status,
        method: originalRequest?.method,
      })

      // Si no hay config o no es retryable, rechazar INMEDIATAMENTE
      if (!originalRequest || !isRetryable(error) || !tokenProvider) {
        console.log('[Interceptor] Not retryable or no config/provider. Rejecting.')
        return Promise.reject(error)
      }

      // Evitar intentar refresh sobre la propia ruta de refresh
      const isRefreshEndpointCalled = originalRequest.url === refreshEndpoint || originalRequest.url?.endsWith(refreshEndpoint)
      if (isRefreshEndpointCalled) {
        // Si falló el refresh endpoint, no intentar más
        console.log('[Interceptor] Refresh endpoint failed. Not retrying.')
        onRefreshError(error)
        return Promise.reject(error)
      }

      // Prevenir reintentos múltiples de la misma request
      // @ts-ignore - agregamos propiedad temporal para tracking
      if (originalRequest._retry) {
        console.log('[Interceptor] Request already retried. Not retrying again.')
        return Promise.reject(error)
      }
      // @ts-ignore
      originalRequest._retry = true

      // Si ya hay un refresh en curso, encolar la petición y devolver una promesa
      if (isRefreshing) {

        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest })
        })
      }

      isRefreshing = true

      try {
        const refreshToken = tokenProvider.getRefreshToken ? await tokenProvider.getRefreshToken() : null

        // Si no hay refresh token no podemos refrescar
        if (!refreshToken) {
          console.log('[Interceptor] No refresh token available.')
          isRefreshing = false
          onRefreshError(error)
          return Promise.reject(error)
        }

        // Llamada al endpoint de refresh usando la misma instancia (pero sin interceptores recursivos)
        // Para asegurarnos de no disparar interceptores que vuelvan a llamar refresh, creamos una instancia temporal.
        const rawAxios = instance // reutilizamos pero prevenimos ciclado mediante flag en config
        const refreshResponse = await rawAxios.post(refreshEndpoint, { refreshToken })

        console.log('[Interceptor] Refresh response:', refreshResponse.data)

        // Asumimos que la respuesta contiene { accessToken, refreshToken? }
        const newAccessToken = (refreshResponse.data && (refreshResponse.data.accessToken || refreshResponse.data.token)) || null
        const newRefreshToken = (refreshResponse.data && (refreshResponse.data.refreshToken)) || null

    

        // Actualizar tokens vía provider (si provee setTokens)
        if (tokenProvider.setTokens) {
          // no await obligatorio pero soportado si retorna promesa
          await tokenProvider.setTokens(newAccessToken, newRefreshToken)
        }

        // Reintentar la request original con el nuevo token
        if (newAccessToken && originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
   

          const actualHeader = originalRequest.headers['Authorization'];
          console.log('[Interceptor] VERIFICATION - Header value:', actualHeader ? actualHeader.substring(0, 50) + '...' : 'NULL');
        } else {
          console.warn('[Interceptor] WARNING: No new access token or no headers to update!')
        }

        processQueue(null, newAccessToken)
        isRefreshing = false

      
    
        return instance.request(originalRequest)
      } catch (refreshError: any) {
        console.log('[Interceptor] Refresh failed:', refreshError.message)
        processQueue(refreshError, null)
        isRefreshing = false
        onRefreshError(refreshError)
        return Promise.reject(refreshError)
      }
    }
  )
}

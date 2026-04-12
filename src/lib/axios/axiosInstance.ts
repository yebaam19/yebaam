import axios, { AxiosInstance } from 'axios'
import { setupInterceptors, setTokenProvider as setProvider, clearTokenProvider as clearProvider, type InterceptorOptions, type TokenProvider } from './interceptors'

/**
 * Configuración de creación de la instancia.
 */
export type AxiosInitOptions = {
  baseURL?: string
  timeout?: number
  defaultHeaders?: Record<string, string>
  tokenProvider?: TokenProvider
  interceptorOptions?: InterceptorOptions
}

/**
 * Instancia única (singleton).
 * No se crea hasta que se llame a getInstance / initAxios.
 */
let instance: AxiosInstance | null = null
let interceptorOptionsGlobal: InterceptorOptions | undefined = undefined
let tokenProviderGlobal: TokenProvider | undefined = undefined
let isInitialized = false

/**
 * Crea la instancia si no existe y configura interceptores.
 */
function createInstance(opts?: AxiosInitOptions): AxiosInstance {
  // Si ya tenemos config guardada de inicialización previa, usarla
  const effectiveOpts = {
    baseURL: opts?.baseURL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
    timeout: opts?.timeout ?? 10000,
    defaultHeaders: opts?.defaultHeaders ?? { 'Content-Type': 'application/json' },
    tokenProvider: opts?.tokenProvider ?? tokenProviderGlobal,
    interceptorOptions: opts?.interceptorOptions ?? interceptorOptionsGlobal,
  };


  const axiosInstance = axios.create({
    baseURL: effectiveOpts.baseURL,
    timeout: effectiveOpts.timeout,
    headers: effectiveOpts.defaultHeaders,
  })

  // Registrar provider (usar el guardado o el nuevo)
  if (effectiveOpts.tokenProvider) {
    tokenProviderGlobal = effectiveOpts.tokenProvider;
    setProvider(effectiveOpts.tokenProvider)
  }

  // Guardamos opciones globales para futuras inicializaciones
  if (effectiveOpts.interceptorOptions) {
    interceptorOptionsGlobal = effectiveOpts.interceptorOptions;
  }

  // Configuramos interceptores usando las opciones efectivas
  setupInterceptors(axiosInstance, effectiveOpts.interceptorOptions)

  return axiosInstance
}

/**
 * initAxios
 *
 * Inicializa (o re-inicializa) la instancia singleton.
 * Llamar al inicio de la app si necesitas pasar un tokenProvider específico.
 */
export function initAxios(opts?: AxiosInitOptions): AxiosInstance {
 
  
  // Guardar opciones globalmente SIEMPRE que se llame initAxios
  if (opts?.tokenProvider) {
    tokenProviderGlobal = opts.tokenProvider;
  }
  if (opts?.interceptorOptions) {
    interceptorOptionsGlobal = opts.interceptorOptions;
  }
  
  if (!instance) {
    instance = createInstance(opts)
    isInitialized = true;
    return instance
  }


  
  if (opts?.tokenProvider) {
    setProvider(opts.tokenProvider)
  }
  
  isInitialized = true;
  return instance
}

/**
 * getAxiosInstance
 *
 * Retorna la instancia existente o crea una con configuración por defecto.
 */
export function getAxiosInstance(): AxiosInstance {
  if (!instance) {
    instance = createInstance()
  }
  return instance
}

/**
 * Re-exportamos utilidades de interceptors para conveniencia
 */
export { setTokenProvider, clearTokenProvider } from './interceptors'
export type { TokenProvider, InterceptorOptions } from './interceptors'

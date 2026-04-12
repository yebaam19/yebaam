/**
 * Feature Flags Configuration
 * Detecta el ambiente basado en NEXT_PUBLIC_APP_URL
 */

// URLs de ambientes
const DEVELOPMENT_URL = 'https://develop.db3pppftvsafp.amplifyapp.com'
const PRODUCTION_URL = 'https://main.db3pppftvsafp.amplifyapp.com' // Ajustar cuando tengas la URL de producción

/**
 * Detecta si estamos en ambiente de desarrollo
 * @returns true si es desarrollo, false si es producción
 */
export const isDevelopment = (): boolean => {
  // En el servidor, usar la variable de ambiente
  if (typeof window === 'undefined') {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL_DEV
    return appUrl?.includes('develop') || appUrl?.includes('localhost') || false
  }
  
  // En el cliente, usar window.location
  const currentUrl = window.location.origin
  return (
    currentUrl.includes('localhost') ||
    currentUrl.includes('develop') ||
    currentUrl === DEVELOPMENT_URL
  )
}

/**
 * Feature Flags
 */
export const featureFlags = {
  // Banner de desarrollo - Desactivado para no molestar
  showDevelopmentBanner: false,
  
  // Login rápido con usuarios de prueba
  showQuickLogin: isDevelopment(),
  
  // Console logs de debug
  enableDebugLogs: isDevelopment(),
  
  // Otras flags que puedas necesitar
  enableBetaFeatures: isDevelopment(),

  // Mostrar "Mis Posts Recientes" en el feed
  showMyRecentPosts: isDevelopment(),

  // ===== HERO DINÁMICO (DESHABILITADO) =====
  // Mantener false hasta que el backend esté listo
  // Para habilitar: agregar NEXT_PUBLIC_ENABLE_DYNAMIC_HERO=true en .env.local
  dynamicHero: false,
  
  heroDebugInfo: false,
  
  heroRevalidateTime: 60,
} as const

/**
 * Información del ambiente actual
 */
export const getEnvironmentInfo = () => {
  return {
    isDevelopment: isDevelopment(),
    environment: isDevelopment() ? 'development' : 'production',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL_DEV || 'unknown',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_DEV || 'unknown',
  }
}

// Log de información del ambiente en desarrollo
if (typeof window !== 'undefined' && featureFlags.enableDebugLogs) {
  console.log('Environment Info:', getEnvironmentInfo())
}

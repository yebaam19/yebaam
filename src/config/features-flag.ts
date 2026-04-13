
export const FEATURE_FLAGS = {
  // ============================================================================
  // NAVEGACIÓN PRINCIPAL
  // ============================================================================
  
  GRUPOS_ENABLED: false, // Grupos - Solo UI/UX implementado
  CLUBES_ENABLED: true, // Clubes - Solo UI/UX implementado
  BLOGS_ENABLED: true, // Blogs - Funcional 
  COMUNIDADES_ENABLED: false, // Comunidades - Solo UI/UX implementado
  CITIES_ENABLED: true, // Portal de Ciudades - Funcional 
  VIDEOS_ENABLED: true, // Videos/Watch - Solo UI/UX implementado

  // ============================================================================
  // COMUNICACIÓN Y SOCIAL
  // ============================================================================
  
  // Chat y Mensajería
  CHAT_ENABLED: true, // Sistema de chat - Funcional
  CHAT_PUBLICO_ENABLED: true, // Chat público - Funcional
  MENSAJES_ENABLED: true, // Mensajes privados - Funcional
  
  // Social Features
  STORIES_ENABLED: true, // Historias - Funcional 
  LIVE_STREAM_ENABLED: true, // Transmisiones en vivo - Funcional 
  FOROS_ENABLED: false, // Foros de discusión - No implementado (Oculto hasta implementación)

  // ============================================================================
  // SECCIÓN PERSONAL
  // ============================================================================
  
  GUARDADOS_ENABLED: false, // Guardados - Solo UI/UX implementado
  FOTOS_ENABLED: true, // Mis fotos - Solo UI/UX implementado
  ME_GUSTA_ENABLED: false, // Me gusta - Solo UI/UX implementado
  RECUERDOS_ENABLED: false, // Recuerdos - Solo UI/UX implementado
  ESTADISTICAS_ENABLED: false, // Estadísticas - Solo UI/UX implementado
  ARBOL_GENEALOGICO_ENABLED: false, // Árbol Genealógico - No disponible aún

  // ============================================================================
  // PERFIL Y PROFESIONAL
  // ============================================================================
  
  PERFIL_PROFESIONAL_ENABLED: true, // Perfil Profesional - Funcional 
  SERVICES_CV_UPLOAD: true, // Subir CV (PDF) para profesionales - No solicitado aún
  SERVICES_PROJECTS_PORTFOLIO: true, // Portafolio de proyectos con URLs - No solicitado aún

  // ============================================================================
  // DIRECTORIOS Y NEGOCIOS
  // ============================================================================
  
  SERVICIOS_PROFESIONALES_ENABLED: true, // Servicios Profesionales - Funcional 
  NEGOCIOS_ENABLED: true, // Negocios - Funcional 
  
  // ============================================================================
  // SERVICIOS PROFESIONALES - FEATURES AVANZADAS
  // ============================================================================


  // ============================================================================
  // COMERCIO Y MARKETPLACE
  // ============================================================================
  
  PROMOCIONES_ENABLED: false, // Promociones y ofertas - No implementado
  CLASIFICADOS_ENABLED: false, // Anuncios clasificados - No implementado
  MARKETPLACE_ENABLED: false, // Marketplace/Tienda - No implementado

  // ============================================================================
  // CONTENIDO Y NOTICIAS
  // ============================================================================
  
  ARTICLES_ENABLED: false, // Artículos/Blogs - Backend no implementado
  NOTICIAS_ENABLED: false, // Sección de noticias - No implementado
  EVENTOS_ENABLED: false, // Eventos y calendario - No implementado

  // ============================================================================
  // AYUDA Y SOPORTE
  // ============================================================================
  
  AYUDA_SOCIAL_ENABLED: false, // Ayuda social/comunitaria - No implementado
  CONTACTO_ENABLED: false, // Formulario de contacto - No implementado
  SOPORTE_ENABLED: false, // Centro de soporte/ayuda - No implementado

  // ============================================================================
  // SISTEMA
  // ============================================================================
  
  NOTIFICATIONS_ENABLED: true, // Notificaciones - Funcional 
  SEARCH_ENABLED: true, // Búsqueda - Funcional 
} as const

/**
 * Verifica si una feature está habilitada
 */
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature]
}

/**
 * Helper para filtrar items de menú basados en feature flags
 */
export function filterByFeatureFlag<T extends { featureFlag?: keyof typeof FEATURE_FLAGS }>(items: T[]): T[] {
  return items.filter((item) => {
    if (!item.featureFlag) return true // Si no tiene flag, siempre se muestra
    return isFeatureEnabled(item.featureFlag)
  })
}

/**
 * Obtener estadísticas de feature flags
 */
export function getFeatureFlagsStats() {
  const flags = Object.entries(FEATURE_FLAGS)
  const enabled = flags.filter(([_, value]) => value === true).length
  const disabled = flags.filter(([_, value]) => value === false).length
  
  return {
    total: flags.length,
    enabled,
    disabled,
    percentage: Math.round((enabled / flags.length) * 100)
  }
}

/**
 * Tipos para TypeScript
 */
export type FeatureFlag = keyof typeof FEATURE_FLAGS

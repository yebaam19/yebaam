
const FEATURE_FLAGS_BASE = {
  // ============================================================================
  // NAVEGACIÓN PRINCIPAL
  // ============================================================================
  
  GRUPOS_ENABLED: false, // Grupos - Solo UI/UX implementado
  CLUBES_ENABLED: true, // Clubes - Solo UI/UX implementado
  BLOGS_ENABLED: true, // Blogs - Funcional 
  COMUNIDADES_ENABLED: true, // Comunidades - MVP funcional (Supabase)
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
  FAMILIAS_ENABLED: true, // Familias / árboles genealógicos por invitación (Supabase)

  // ============================================================================
  // PERFIL Y PROFESIONAL
  // ============================================================================
  
  PERFIL_PROFESIONAL_ENABLED: true, // Perfil Profesional - Funcional 
  // Apagado: no existe ruta de subida de documentos PDF (Cloudflare Images rechaza
  // PDFs y no hay bucket de Storage para CVs de servicios). Reactivar cuando exista
  // la infraestructura de documentos.
  SERVICES_CV_UPLOAD: false, // Subir CV (PDF) para profesionales
  // Apagado: pendiente la columna `portfolio_projects` (jsonb) en
  // `professional_services` — sin ella los proyectos se pierden en silencio al
  // guardar. Reactivar cuando llegue la migración de persistencia.
  SERVICES_PROJECTS_PORTFOLIO: false, // Portafolio de proyectos con URLs

  // ============================================================================
  // DIRECTORIOS Y NEGOCIOS
  // ============================================================================
  
  SERVICIOS_PROFESIONALES_ENABLED: true, // Servicios Profesionales - Funcional 
  NEGOCIOS_ENABLED: false, // unificado en /negocios via COMIDAS_ENABLED
  COMIDAS_ENABLED: true, // ComídasYebaam — directorio de negocios gastronómicos
  ARTISTAS_ENABLED: true, // PerfilArtístico — perfiles artísticos y servicios creativos
  ESCUELAS_ENABLED: true, // YebaamEscuelas — directorio de escuelas artísticas
  
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

/** Env-driven kill switch for the music archive / Club de Coleccionistas
 *  module. Set NEXT_PUBLIC_MUSIC_CLUB_ENABLED=false at build time to disable
 *  the sidebar entries and 404 the /musica and /admin/music routes. */
export const FEATURE_FLAGS = {
  ...FEATURE_FLAGS_BASE,
  MUSIC_CLUB_ENABLED: process.env.NEXT_PUBLIC_MUSIC_CLUB_ENABLED !== 'false',
}

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

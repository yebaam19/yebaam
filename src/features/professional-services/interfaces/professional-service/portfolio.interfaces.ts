// ============================================================================
// PORTAFOLIO
// ============================================================================

/**
 * Proyecto del portafolio profesional
 * Feature flag: SERVICES_PROJECTS_PORTFOLIO
 */
export interface PortfolioProject {
  title: string
  description?: string
  url?: string
  githubUrl?: string
  imageUrl?: string
  technologies?: string[]
  startDate?: string
  endDate?: string
}

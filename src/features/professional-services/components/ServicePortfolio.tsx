'use client'

/**
 * ServicePortfolio Component
 *
 * Componente para mostrar el portafolio de proyectos del profesional
 * Feature flag: SERVICES_PROJECTS_PORTFOLIO
 */

import { FEATURE_FLAGS } from '@/config/features-flag'
import { CodeBracketIcon, LinkIcon, PhotoIcon } from '@heroicons/react/24/outline'
import type { PortfolioProject } from '../interfaces/professional-service.interfaces'

interface ServicePortfolioProps {
  projects?: PortfolioProject[]
  serviceName: string
}

export function ServicePortfolio({ projects, serviceName }: ServicePortfolioProps) {
  // Solo mostrar si el feature flag está activo y hay proyectos
  if (!FEATURE_FLAGS.SERVICES_PROJECTS_PORTFOLIO || !projects || projects.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Portafolio de Proyectos</h2>
        <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/20 dark:text-primary-400">
          {projects.length} {projects.length === 1 ? 'proyecto' : 'proyectos'}
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {projects.map((project, index) => (
          <article
            key={index}
            className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
          >
            {/* Imagen del proyecto */}
            {project.imageUrl ? (
              <div className="aspect-video w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="aspect-video flex w-full items-center justify-center bg-linear-to-br from-primary-100 to-primary-200 dark:from-primary-900/20 dark:to-primary-800/20">
                <PhotoIcon className="h-16 w-16 text-primary-400 dark:text-primary-600" />
              </div>
            )}

            {/* Contenido */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{project.title}</h3>

              {project.description && (
                <p className="mt-2 line-clamp-3 text-sm text-neutral-600 dark:text-neutral-400">
                  {project.description}
                </p>
              )}

              {/* Tecnologías */}
              {project.technologies && project.technologies.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.technologies.slice(0, 5).map((tech, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > 5 && (
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400">
                      +{project.technologies.length - 5}
                    </span>
                  )}
                </div>
              )}

              {/* Fechas */}
              {(project.startDate || project.endDate) && (
                <p className="mt-3 text-xs font-medium text-neutral-500 dark:text-neutral-500">
                  {project.startDate &&
                    new Date(project.startDate).toLocaleDateString('es-ES', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  {project.startDate && project.endDate && ' - '}
                  {project.endDate
                    ? new Date(project.endDate).toLocaleDateString('es-ES', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : project.startDate && 'Presente'}
                </p>
              )}

              {/* Enlaces */}
              {(project.url || project.githubUrl) && (
                <div className="mt-4 flex gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-700">
                  {project.url && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Ver proyecto
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                    >
                      <CodeBracketIcon className="h-4 w-4" />
                      GitHub
                    </a>
                  )}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

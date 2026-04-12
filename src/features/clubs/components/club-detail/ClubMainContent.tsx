import { Club } from '@/features/clubs/types/club.types';
import { TabType } from './ClubTabs';

interface ClubMainContentProps {
  club: Club;
  activeTab: TabType;
}

/**
 * Componente para el contenido principal según el tab activo
 * Renderiza diferentes vistas: inicio, eventos, miembros, acerca-de
 */
export function ClubMainContent({ club, activeTab }: ClubMainContentProps) {
  return (
    <div className="lg:col-span-2">
      {activeTab === 'inicio' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Acerca de este club
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {club.description}
          </p>

          {club.tags && club.tags.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Temas relacionados
              </h3>
              <div className="flex flex-wrap gap-2">
                {club.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'eventos' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Próximos Eventos
          </h2>
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No hay eventos programados por el momento
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Los eventos se mostrarán aquí cuando estén disponibles
            </p>
          </div>
        </div>
      )}

      {activeTab === 'miembros' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Miembros del Club
          </h2>
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              {club.stats.membersCount} miembros en total
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              La lista de miembros estará disponible próximamente
            </p>
          </div>
        </div>
      )}

      {activeTab === 'acerca-de' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Información del Club
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Descripción
              </h3>
              <p className="text-gray-900 dark:text-white leading-relaxed">
                {club.description}
              </p>
            </div>

            {club.location && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Ubicación
                </h3>
                <p className="text-gray-900 dark:text-white">{club.location}</p>
              </div>
            )}

            {club.website && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Sitio Web
                </h3>
                <a
                  href={club.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {club.website}
                </a>
              </div>
            )}

            {club.rules && club.rules.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  Reglas del Club
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-900 dark:text-white">
                  {club.rules.map((rule, index) => (
                    <li key={index} className="leading-relaxed">
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {club.subcategory && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Subcategoría
                </h3>
                <p className="text-gray-900 dark:text-white">{club.subcategory}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

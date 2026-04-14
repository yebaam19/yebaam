import { FC } from 'react';
import {
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
  CalendarIcon,
  ChartBarIcon,
} from '@/components/icons/heroicons-shim';
import type { Page } from '../../types/page.types';
import { getCategoryLabel, formatRelativeDate } from '../../utils/pageHelpers';

interface PageDetailAboutProps {
  page: Page;
}

export const PageDetailAbout: FC<PageDetailAboutProps> = ({ page }) => {
  return (
    <div className="space-y-6">
      {/* Descripción */}
      {page.description && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Descripción
          </h3>
          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
            {page.description}
          </p>
        </div>
      )}

      {/* Información general */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Información general
        </h3>
        
        <div className="space-y-4">
          {/* Categoría */}
          <div className="flex items-start gap-3">
            <ChartBarIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Categoría
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getCategoryLabel(page.category)}
                {page.subcategory && ` • ${page.subcategory}`}
              </p>
            </div>
          </div>

          {/* Fecha de creación */}
          <div className="flex items-start gap-3">
            <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Creada
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatRelativeDate(page.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Información de contacto */}
      {page.contact && Object.keys(page.contact).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Información de contacto
          </h3>
          
          <div className="space-y-4">
            {/* Email */}
            {page.contact.email && (
              <div className="flex items-start gap-3">
                <EnvelopeIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Correo electrónico
                  </p>
                  <a
                    href={`mailto:${page.contact.email}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {page.contact.email}
                  </a>
                </div>
              </div>
            )}

            {/* Teléfono */}
            {page.contact.phone && (
              <div className="flex items-start gap-3">
                <PhoneIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Teléfono
                  </p>
                  <a
                    href={`tel:${page.contact.phone}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {page.contact.phone}
                  </a>
                </div>
              </div>
            )}

            {/* Sitio web */}
            {page.contact.website && (
              <div className="flex items-start gap-3">
                <GlobeAltIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sitio web
                  </p>
                  <a
                    href={page.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {page.contact.website}
                  </a>
                </div>
              </div>
            )}

            {/* Dirección */}
            {page.contact.address &&
              (page.contact.address.street ||
                page.contact.address.city ||
                page.contact.address.country) && (
                <div className="flex items-start gap-3">
                  <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dirección
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {page.contact.address.street && (
                        <>
                          {page.contact.address.street}
                          <br />
                        </>
                      )}
                      {page.contact.address.city && `${page.contact.address.city}`}
                      {page.contact.address.city && page.contact.address.country && ', '}
                      {page.contact.address.country}
                    </p>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Estadísticas
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {page.postCount}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Publicaciones
            </p>
          </div>

          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {page.followerCount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Seguidores
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

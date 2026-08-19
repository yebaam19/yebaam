'use client';

import { FC } from 'react';
import {
  CheckBadgeIcon,
  MapPinIcon,
  GlobeAmericasIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
} from '@/components/icons/heroicons-shim';
import type { Page } from '../../../types/page.types';
import { formatFollowersCount } from '../../../utils/pageHelpers';
import { SOCIAL_NETWORKS } from '../../settings/general/social-networks';
import { safeExternalHref } from '@/lib/safe-href';

interface PageDetailsCardProps {
  page: Page;
}

/**
 * "Detalles" del wireframe (pág. 13) = PDF §3 "Información del Perfil":
 * debajo de la fotografía deben mostrarse Nombre, País, Ciudad y Redes sociales.
 *
 * `page.contact` sólo llega si la página es pública o el visitante es del equipo
 * (el gate vive en `mapPage`, Art. 2 Ley 1581), así que País/Ciudad/Redes
 * simplemente no se pintan cuando el visitante no tiene derecho a verlos.
 */
export const PageDetailsCard: FC<PageDetailsCardProps> = ({ page }) => {
  const city = page.contact?.address?.city;
  const country = page.contact?.address?.country;
  const social = page.contact?.social;
  const socialLinks = social ? SOCIAL_NETWORKS.filter((n) => social[n.key]) : [];
  const websiteHref = safeExternalHref(page.contact?.website);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-4">
      {/* Nombre */}
      <div>
        <div className="flex items-start gap-1.5">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
            {page.name}
          </h1>
          {page.isVerified && (
            <CheckBadgeIcon className="w-5 h-5 shrink-0 text-blue-500 mt-0.5" />
          )}
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {formatFollowersCount(page.followerCount)} seguidores
        </p>
      </div>

      {/* País / Ciudad / contacto directo (PDF §3) */}
      {(country || city || page.contact?.email || page.contact?.phone || page.contact?.website) && (
        <div className="space-y-2 border-t border-gray-100 dark:border-gray-700 pt-3">
          {country && (
            <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <GlobeAmericasIcon className="w-4 h-4 shrink-0 text-gray-400" />
              {country}
            </p>
          )}
          {city && (
            <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPinIcon className="w-4 h-4 shrink-0 text-gray-400" />
              {city}
            </p>
          )}
          {page.contact?.email && (
            <a
              href={`mailto:${page.contact.email}`}
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
            >
              <EnvelopeIcon className="w-4 h-4 shrink-0 text-gray-400" />
              {page.contact.email}
            </a>
          )}
          {page.contact?.phone && (
            <a
              href={`tel:${page.contact.phone}`}
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <PhoneIcon className="w-4 h-4 shrink-0 text-gray-400" />
              {page.contact.phone}
            </a>
          )}
          {websiteHref && (
            <a
              href={websiteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
            >
              <GlobeAltIcon className="w-4 h-4 shrink-0 text-gray-400" />
              {page.contact?.website}
            </a>
          )}
        </div>
      )}

      {/* Redes sociales */}
      {socialLinks.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Redes sociales
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {socialLinks.map((n) => (
              <a
                key={n.key}
                href={n.href(social![n.key] as string)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {n.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

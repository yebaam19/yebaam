'use client';

import { FC } from 'react';
import {
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
} from '@/components/icons/heroicons-shim';
import type { Page } from '../../../types/page.types';
import { SOCIAL_NETWORKS } from '../../settings/general/social-networks';
import { PageContactForm } from './PageContactForm';

interface PageContactPanelProps {
  page: Page;
}

/** Sección "Contacto" del menú lateral (PDF §7). Sólo datos reales de `page.contact`. */
export const PageContactPanel: FC<PageContactPanelProps> = ({ page }) => {
  const contact = page.contact;
  const address = contact?.address;
  const social = contact?.social;
  const socialLinks = social ? SOCIAL_NETWORKS.filter((n) => social[n.key]) : [];

  const hasAddress = Boolean(address?.street || address?.city || address?.country);
  const hasAnything =
    Boolean(contact?.email || contact?.phone || contact?.website) ||
    hasAddress ||
    socialLinks.length > 0;

  if (!hasAnything) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Contacto</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Esta página todavía no ha publicado datos de contacto.
        </p>
        <PageContactForm page={page} />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Contacto</h2>
        {/* Transparencia (Contrato de Usuario cl.21 / Ley 1581): datos aportados por
            el titular de la página, no recolectados de terceros. */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Datos de contacto publicados por la página.
        </p>

        <div className="space-y-4">
        {contact?.email && (
          <div className="flex items-start gap-3">
            <EnvelopeIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
            <a
              href={`mailto:${contact.email}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
            >
              {contact.email}
            </a>
          </div>
        )}

        {contact?.phone && (
          <div className="flex items-start gap-3">
            <PhoneIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
            <a
              href={`tel:${contact.phone}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {contact.phone}
            </a>
          </div>
        )}

        {contact?.website && (
          <div className="flex items-start gap-3">
            <GlobeAltIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
            <a
              href={contact.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
            >
              {contact.website}
            </a>
          </div>
        )}

        {hasAddress && (
          <div className="flex items-start gap-3">
            <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {address?.street && (
                <>
                  {address.street}
                  <br />
                </>
              )}
              {address?.city}
              {address?.city && address?.country && ', '}
              {address?.country}
            </p>
          </div>
        )}

        {socialLinks.length > 0 && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Redes sociales
            </h3>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map((n) => (
                <a
                  key={n.key}
                  href={n.href(social![n.key] as string)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {n.label}
                </a>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Escríbenos
        </h3>
        <PageContactForm page={page} />
      </div>
    </div>
  );
};

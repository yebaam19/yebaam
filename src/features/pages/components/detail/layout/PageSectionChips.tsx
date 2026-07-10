'use client';

import { FC } from 'react';
import { PAGE_TAB_DEFS, type PageTabId } from '../../../config/page-tabs';

interface PageSectionChipsProps {
  tabs: PageTabId[];
  /** `null` = vista por defecto (destacado + muro), ninguna ficha activa. */
  activeTab: PageTabId | null;
  onTabChange: (tab: PageTabId | null) => void;
}

/**
 * Las seis fichas del wireframe (pág. 13, PDF §4), en rejilla de tres por fila.
 *
 * Volver a pulsar la ficha activa la cierra y devuelve a la vista por defecto:
 * en el wireframe el muro no es una ficha, así que sin esto no habría forma de
 * regresar a él sin recargar.
 */
export const PageSectionChips: FC<PageSectionChipsProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
    {tabs.map((id) => {
      const def = PAGE_TAB_DEFS[id];
      const Icon = def.icon;
      const isActive = activeTab === id;

      return (
        <button
          key={id}
          type="button"
          aria-pressed={isActive}
          onClick={() => onTabChange(isActive ? null : id)}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
            isActive
              ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-400'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span className="truncate">{def.label}</span>
        </button>
      );
    })}
  </div>
);

'use client';

import { FC } from 'react';
import type { PageSideItem, PageSideSectionId } from '../../../config/page-side-menu';

interface PageSideMenuProps {
  items: PageSideItem[];
  activeSection: PageSideSectionId | null;
  onSectionChange: (section: PageSideSectionId) => void;
  isOwner: boolean;
  /** Conteos reales por sección. Una sección sin conteo no pinta píldora. */
  counts?: Partial<Record<PageSideSectionId, number>>;
}

/**
 * Rail izquierdo de la Página (wireframe pág. 13, PDF §7).
 *
 * Una sección con `available: false` se pinta deshabilitada y marcada como
 * "Próximamente" en vez de ocultarse: el wireframe la muestra, y esconderla
 * daría la impresión de que el rail está completo.
 */
export const PageSideMenu: FC<PageSideMenuProps> = ({
  items,
  activeSection,
  onSectionChange,
  isOwner,
  counts,
}) => {
  const visible = items.filter((item) => !item.ownerOnly || isOwner);

  return (
    <nav className="space-y-1" aria-label="Secciones de la página">
      {visible.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        const count = counts?.[item.id];

        return (
          <button
            key={item.id}
            type="button"
            disabled={!item.available}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onSectionChange(item.id)}
            title={item.available ? undefined : 'Próximamente'}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left transition-colors ${
              !item.available
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="flex items-center gap-3 min-w-0">
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  !item.available
                    ? 'text-gray-300 dark:text-gray-700'
                    : isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400'
                }`}
              />
              <span className="text-sm font-medium leading-tight min-w-0 break-words text-left">
                {item.label}
              </span>
            </span>

            {item.available && count !== undefined && (
              <span
                className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {count}
              </span>
            )}

            {!item.available && (
              <span className="shrink-0 text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-600">
                Pronto
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

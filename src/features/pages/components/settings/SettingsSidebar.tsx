import { FC } from 'react';
import {
  Cog6ToothIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';

type SettingsSection = 'general' | 'appearance' | 'products' | 'roles' | 'stats' | 'danger';

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

interface SidebarItem {
  id: SettingsSection;
  label: string;
  icon: typeof Cog6ToothIcon;
  description: string;
}

const sections: SidebarItem[] = [
  {
    id: 'general',
    label: 'Información general',
    icon: Cog6ToothIcon,
    description: 'Nombre, descripción y contacto',
  },
  {
    id: 'appearance',
    label: 'Apariencia',
    icon: PhotoIcon,
    description: 'Imágenes y diseño',
  },
  {
    id: 'products',
    label: 'Productos',
    icon: ShoppingBagIcon,
    description: 'Gestionar productos y servicios',
  },
  {
    id: 'roles',
    label: 'Roles y permisos',
    icon: UserGroupIcon,
    description: 'Administrar equipo',
  },
  {
    id: 'stats',
    label: 'Estadísticas',
    icon: ChartBarIcon,
    description: 'Métricas y análisis',
  },
  {
    id: 'danger',
    label: 'Zona peligrosa',
    icon: ExclamationTriangleIcon,
    description: 'Eliminar página',
  },
];

export const SettingsSidebar: FC<SettingsSidebarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2">
      <nav className="space-y-1">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          const isDanger = section.id === 'danger';

          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                isActive
                  ? isDanger
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  : isDanger
                  ? 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/10'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Icon
                className={`w-5 h-5 mt-0.5 shrink-0 ${
                  isActive
                    ? isDanger
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-blue-600 dark:text-blue-400'
                    : isDanger
                    ? 'text-red-500 dark:text-red-400'
                    : 'text-gray-400'
                }`}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    isActive
                      ? isDanger
                        ? 'text-red-900 dark:text-red-300'
                        : 'text-blue-900 dark:text-blue-300'
                      : isDanger
                      ? 'text-red-700 dark:text-red-400'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {section.label}
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    isActive
                      ? isDanger
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {section.description}
                </p>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

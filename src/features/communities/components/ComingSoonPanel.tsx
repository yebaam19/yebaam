import type { ComponentType, SVGProps } from 'react';

interface ComingSoonPanelProps {
  title: string;
  description?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
}

export function ComingSoonPanel({ title, description, icon: Icon }: ComingSoonPanelProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
      {Icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
          <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
      )}
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
        {description ?? 'Esta sección estará disponible próximamente.'}
      </p>
      <span className="mt-4 inline-block rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-medium px-3 py-1">
        Próximamente
      </span>
    </div>
  );
}

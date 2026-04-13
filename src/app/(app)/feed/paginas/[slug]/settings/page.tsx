'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeftIcon } from '@/components/icons/heroicons-shim';
import Link from 'next/link';
import { usePageBySlug } from '@/features/pages/hooks/usePages';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { 
  SettingsSidebar, 
  SettingsGeneral, 
  SettingsAppearance,
  SettingsProducts,
  SettingsRoles, 
  SettingsStats, 
  SettingsDangerZone 
} from '@/features/pages/components/settings';

type SettingsSection = 'general' | 'appearance' | 'products' | 'roles' | 'stats' | 'danger';

export default function PageSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageSlug = params.slug as string;
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const currentUser = useAuthStore((state) => state.user);

  // Check for section query param and set initial section
  useEffect(() => {
    const section = searchParams.get('section') as SettingsSection;
    if (section && ['general', 'appearance', 'products', 'roles', 'stats', 'danger'].includes(section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  // Obtener la página real desde el backend
  const { data: pageResponse, isLoading, error } = usePageBySlug(pageSlug);
  const page = pageResponse?.page;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  // Error or page not found
  if (error || !page) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Página no encontrada
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            La página que buscas no existe o ha sido eliminada.
          </p>
          <Link
            href="/feed/paginas"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Ir a páginas
          </Link>
        </div>
      </div>
    );
  }

  // Check if user is owner (usando el mismo check que en PageDetailHeader)
  const isOwner = currentUser?.id === page.ownerId;
  const isAdmin = page.userRole === 'admin';

  // Check if user has admin access
  if (!isOwner && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acceso denegado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No tienes permisos para acceder a la configuración de esta página.
          </p>
          <Link
            href={`/feed/paginas/${page.slug}`}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Volver a la página
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href={`/feed/paginas/${page.slug}`}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Configuración de página
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {page.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <SettingsSidebar
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeSection === 'general' && <SettingsGeneral page={page} />}
            {activeSection === 'appearance' && <SettingsAppearance page={page} />}
            {activeSection === 'products' && <SettingsProducts pageId={page.id} />}
            {activeSection === 'roles' && <SettingsRoles page={page} />}
            {activeSection === 'stats' && <SettingsStats page={page} />}
            {activeSection === 'danger' && <SettingsDangerZone page={page} />}
          </div>
        </div>
      </div>
    </div>
  );
}

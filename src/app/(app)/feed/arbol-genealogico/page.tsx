import { FamilyTree } from '@/components/FamilyTree';
import { isFeatureEnabled } from '@/config/features-flag';
import { ExclamationTriangleIcon } from '@/components/icons/heroicons-shim';
import Link from 'next/link';

export default function ArbolGenealogico() {
  // Verificar si la funcionalidad está habilitada
  if (!isFeatureEnabled('ARBOL_GENEALOGICO_ENABLED')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-yellow-100 dark:bg-yellow-900/20 rounded-full p-4">
                <ExclamationTriangleIcon className="w-16 h-16 text-yellow-600 dark:text-yellow-500" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Funcionalidad No Disponible
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
              El Árbol Genealógico aún no está disponible. Estamos trabajando para traerte esta funcionalidad pronto.
            </p>
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Mientras tanto, puedes explorar otras secciones de la plataforma
              </p>
              <Link
                href="/feed"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Volver al Feed
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Mi Árbol Genealógico
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explora y construye tu historia familiar
          </p>
        </div>
        <FamilyTree />
      </div>
    </div>
  );
}

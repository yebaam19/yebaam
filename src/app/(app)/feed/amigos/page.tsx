'use client';

import { FriendRequestsList } from '@/features/user/components/FriendRequestsList';
import { FriendsList } from '@/features/user/components/FriendsList';
import { FriendSuggestions } from '@/features/user/components/FriendSuggestions';

import { 
  UserGroupIcon, 
  UserPlusIcon,
  SparklesIcon 
} from '@/components/icons/heroicons-shim';

/**
 * Página de Amigos
 * 
 * Muestra:
 * 1. Solicitudes de amistad pendientes
 * 2. Lista de amigos actuales (grid con filtros)
 * 3. Sugerencias de personas que quizás conozcas
 */
export default function AmigosPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <UserGroupIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
              Amigos
            </h1>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400">
            Conecta con personas que conoces y descubre nuevas amistades
          </p>
        </div>

        {/* Solicitudes de amistad pendientes */}
        <div className="mb-8">
          <FriendRequestsList />
        </div>

        {/* Lista de amigos actuales */}
        <div className="mb-12">
          <FriendsList />
        </div>

        {/* Separador visual */}
        <div className="relative mb-12">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-neutral-300 dark:border-neutral-700" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-neutral-50 dark:bg-neutral-950 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
              <SparklesIcon className="w-5 h-5" />
              Descubre nuevas conexiones
            </span>
          </div>
        </div>

        {/* Sugerencias de amigos */}
        <div>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <UserPlusIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Personas que quizás conozcas
              </h2>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              Basado en amigos mutuos, ubicación e intereses en común
            </p>
          </div>

          <FriendSuggestions />
        </div>
      </div>
    </div>
  );
}

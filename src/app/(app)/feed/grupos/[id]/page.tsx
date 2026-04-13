'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  UserGroupIcon, 
  GlobeAltIcon, 
  LockClosedIcon,
  ArrowLeftIcon,
  Cog6ToothIcon,
  UsersIcon,
  DocumentTextIcon,
  InformationCircleIcon,
} from '@/components/icons/heroicons-shim';
import { useGroup } from '@/features/groups/hooks/useGroups';

type TabType = 'posts' | 'members' | 'about';

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;
  
  const { data: group, isLoading } = useGroup(groupId);
  const [activeTab, setActiveTab] = useState<TabType>('posts');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <div className="animate-pulse">
          {/* Cover skeleton */}
          <div className="h-64 bg-neutral-200 dark:bg-neutral-800" />
          {/* Content skeleton */}
          <div className="container mx-auto max-w-5xl px-4 py-6">
            <div className="space-y-4">
              <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <UserGroupIcon className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Grupo no encontrado
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            El grupo que buscas no existe o fue eliminado
          </p>
          <Link
            href="/grupos"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Volver a grupos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Cover Image */}
      <div className="relative h-64 bg-linear-to-br from-blue-500 to-purple-600">
        {group.coverImageUrl ? (
          <Image
            src={group.coverImageUrl}
            alt={group.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <UserGroupIcon className="h-24 w-24 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
        
        {/* Back button */}
        <Link
          href="/grupos"
          className="absolute top-4 left-4 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6 text-white" />
        </Link>
      </div>

      {/* Group Info */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                  {group.name}
                </h1>
                <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center gap-1">
                    {group.privacy === 'public' ? (
                      <>
                        <GlobeAltIcon className="h-4 w-4" />
                        <span>Grupo público</span>
                      </>
                    ) : (
                      <>
                        <LockClosedIcon className="h-4 w-4" />
                        <span>Grupo privado</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <UsersIcon className="h-4 w-4" />
                    <span>{group.memberCount.toLocaleString()} miembros</span>
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {group.isAdmin && (
                  <Link
                    href={`/grupos/${groupId}/configuracion`}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    <Cog6ToothIcon className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
                  </Link>
                )}
                {!group.isMember && (
                  <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors">
                    Unirse al grupo
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800 -mb-6">
              <button
                onClick={() => setActiveTab('posts')}
                className={`px-4 py-3 font-medium transition-colors relative ${
                  activeTab === 'posts'
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5" />
                  Publicaciones
                </div>
                {activeTab === 'posts' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`px-4 py-3 font-medium transition-colors relative ${
                  activeTab === 'members'
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-5 w-5" />
                  Miembros
                </div>
                {activeTab === 'members' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`px-4 py-3 font-medium transition-colors relative ${
                  activeTab === 'about'
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <InformationCircleIcon className="h-5 w-5" />
                  Acerca de
                </div>
                {activeTab === 'about' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'posts' && (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              No hay publicaciones aún
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Sé el primero en compartir algo en este grupo
            </p>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="text-center py-12">
            <UsersIcon className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              {group.memberCount} miembros
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              La lista de miembros se mostrará aquí
            </p>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="max-w-3xl">
            <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                Descripción
              </h3>
              <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                {group.description}
              </p>
              
              <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                  Detalles
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-neutral-600 dark:text-neutral-400">Categoría</dt>
                    <dd className="text-sm font-medium text-neutral-900 dark:text-white mt-1">
                      {group.category}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-neutral-600 dark:text-neutral-400">Privacidad</dt>
                    <dd className="text-sm font-medium text-neutral-900 dark:text-white mt-1">
                      {group.privacy === 'public' ? 'Público' : 'Privado'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-neutral-600 dark:text-neutral-400">Creado</dt>
                    <dd className="text-sm font-medium text-neutral-900 dark:text-white mt-1">
                      {new Date(group.createdAt || '').toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

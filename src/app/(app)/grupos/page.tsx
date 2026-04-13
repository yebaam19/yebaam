'use client';

import { useState } from 'react';
import { UserGroupIcon, PlusIcon, SparklesIcon } from '@/components/icons/heroicons-shim';
import { GroupsGrid, GroupsSearchBar, GroupsEmptyState, CreateGroupModal } from '@/features/groups/components';
import { useMyGroups, useSuggestedGroups, useSearchGroups } from '@/features/groups/hooks/useGroups';
import { useGroupsUIStore } from '@/features/groups/store/groupsUIStore';
import type { GroupTab } from '@/features/groups/types/group.types';

/**
 * Página de Grupos
 * 
 * Usa React Query para fetching de datos y Zustand para estado UI
 */
export default function GruposPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Estado UI desde Zustand
  const activeTab = useGroupsUIStore((state) => state.activeTab);
  const searchQuery = useGroupsUIStore((state) => state.searchQuery);
  const setActiveTab = useGroupsUIStore((state) => state.setActiveTab);
  const setSearchQuery = useGroupsUIStore((state) => state.setSearchQuery);

  // Fetching con React Query
  const { data: myGroups = [], isLoading: isLoadingMyGroups } = useMyGroups();
  const { data: suggestedGroups = [], isLoading: isLoadingSuggestions } = useSuggestedGroups();
  
  // Búsqueda en el backend
  const { data: searchResults = [], isLoading: isLoadingSearch } = useSearchGroups(
    searchQuery,
    isSearching && searchQuery.length > 0
  );

  // Determinar qué grupos mostrar en el tab "Descubrir"
  const discoverGroups = isSearching && searchQuery.length > 0 ? searchResults : suggestedGroups;
  const isLoadingDiscover = isSearching ? isLoadingSearch : isLoadingSuggestions;

  const handleSearch = () => {
    if (searchQuery.trim().length > 0) {
      setIsSearching(true);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Si borra el texto, volver a sugerencias
    if (value.trim().length === 0) {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-dvh min-w-0 bg-neutral-50 dark:bg-neutral-950">
      <div className="container mx-auto max-w-7xl min-w-0 px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                <UserGroupIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-white">
                  Grupos
                </h1>
                <p className="text-sm text-neutral-600 sm:text-base dark:text-neutral-400">
                  Conecta con personas que comparten tus intereses
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 sm:w-auto"
            >
              <PlusIcon className="h-5 w-5" />
              Crear grupo
            </button>
          </div>

          {/* Tabs */}
          <div className="-mx-3 flex gap-2 overflow-x-auto border-b border-neutral-200 px-3 pb-px sm:mx-0 sm:px-0 dark:border-neutral-800">
            <button
              onClick={() => setActiveTab('my-groups')}
              className={`px-4 py-3 font-medium transition-colors relative ${
                activeTab === 'my-groups'
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Mis grupos
              {activeTab === 'my-groups' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={`px-4 py-3 font-medium transition-colors relative ${
                activeTab === 'discover'
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Descubrir
              {activeTab === 'discover' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
              )}
            </button>
          </div>
        </div>

        {/* Search Bar (solo en discover) */}
        {activeTab === 'discover' && (
          <div className="mb-6">
            <GroupsSearchBar 
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
            />
          </div>
        )}

        {/* Content */}
        {activeTab === 'my-groups' ? (
          <div>
            {isLoadingMyGroups ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-pulse">
                    <div className="h-32 bg-neutral-200 dark:bg-neutral-700" />
                    <div className="p-4 space-y-3">
                      <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : myGroups.length === 0 ? (
              <GroupsEmptyState
                title="No eres miembro de ningún grupo"
                description="Únete a grupos para conectar con personas que comparten tus intereses"
                actionLabel="Descubrir grupos"
                onAction={() => setActiveTab('discover')}
              />
            ) : (
              <GroupsGrid groups={myGroups} />
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <SparklesIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                {isSearching && searchQuery ? 'Resultados de búsqueda' : 'Grupos sugeridos para ti'}
              </h2>
            </div>
            {isLoadingDiscover ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-pulse">
                    <div className="h-32 bg-neutral-200 dark:bg-neutral-700" />
                    <div className="p-4 space-y-3">
                      <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <GroupsGrid 
                groups={discoverGroups}
                emptyMessage={
                  isSearching 
                    ? 'No se encontraron grupos con ese criterio de búsqueda' 
                    : 'No hay grupos sugeridos disponibles'
                }
              />
            )}
          </div>
        )}
      </div>

      {/* Modal de Crear Grupo */}
      <CreateGroupModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}

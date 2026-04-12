import { FC, useState, Fragment } from 'react';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { usePageFollowers } from '../../hooks/usePageCommunity';
import { FollowerSortBy } from '../../services/page-community.service';
import { CommunityMemberCard } from './CommunityMemberCard';
import { CommunityTabs, CommunityTabType } from './CommunityTabs';
import { CommunityMember } from '../../interfaces/community.interface';

interface PageDetailCommunityProps {
  pageId: string;
}

type FilterOption = {
  id: FollowerSortBy;
  label: string;
  description: string;
};

const filterOptions: FilterOption[] = [
  {
    id: 'recent',
    label: 'Recientes',
    description: 'Ordenar por más recientes',
  },
  {
    id: 'alphabetical',
    label: 'Alfabético',
    description: 'Ordenar de A a Z',
  },
  {
    id: 'popular',
    label: 'Más populares',
    description: 'Ordenar por popularidad',
  },
];

export const PageDetailCommunity: FC<PageDetailCommunityProps> = ({ pageId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<CommunityTabType>('all');
  const [sortBy, setSortBy] = useState<FollowerSortBy>('recent');

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePageFollowers(pageId, 20, sortBy);

  const allMembers = data?.pages.flatMap((page) => page.followers) || [];
  const totalMembers = data?.pages[0]?.total || 0;

  // Determine sortBy based on active tab
  const handleTabChange = (tab: CommunityTabType) => {
    setActiveTab(tab);
    
    // Update sortBy based on tab
    if (tab === 'followers') {
      setSortBy('recent');
    } else if (tab === 'fans') {
      setSortBy('popular');
    } else {
      setSortBy('recent'); // default for 'all'
    }
  };

  // Filter members by search query
  const filteredMembers = allMembers.filter((member) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      member.username.toLowerCase().includes(searchLower) ||
      member.firstName.toLowerCase().includes(searchLower) ||
      member.lastName.toLowerCase().includes(searchLower)
    );
  });

  const handleFollow = (memberId: string) => {
    console.log('Follow member:', memberId);
    // TODO: Implement follow user functionality
  };

  const handleMessage = (memberId: string) => {
    console.log('Message member:', memberId);
    // TODO: Implement message user functionality
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty State
  if (totalMembers === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Comunidad
        </h2>

        <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <UsersIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Sin seguidores aún
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md">
            Esta página aún no tiene seguidores. Sé el primero en seguirla para formar parte de su comunidad.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Comunidad
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {totalMembers} {totalMembers === 1 ? 'seguidor' : 'seguidores'}
        </p>
      </div>

      {/* Tabs */}
      <CommunityTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        counts={{
          all: totalMembers,
          followers: totalMembers,
          fans: Math.floor(totalMembers * 0.3), // Example: 30% are top fans
        }}
      />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar miembros..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Dropdown */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
            <FunnelIcon className="w-5 h-5" />
            <span className="font-medium">
              {filterOptions.find((f) => f.id === sortBy)?.label || 'Ordenar'}
            </span>
            <ChevronDownIcon className="w-4 h-4" />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="py-1">
                {filterOptions.map((option) => (
                  <Menu.Item key={option.id}>
                    {({ active }) => (
                      <button
                        onClick={() => setSortBy(option.id)}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          sortBy === option.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                            : active
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {option.description}
                        </div>
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* Members List */}
      <div className="space-y-3">
        {filteredMembers.map((member) => (
          <CommunityMemberCard
            key={member.id}
            member={member}
            onFollow={handleFollow}
            onMessage={handleMessage}
          />
        ))}
      </div>

      {/* Search No Results */}
      {filteredMembers.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            No se encontraron miembros con "{searchQuery}"
          </p>
        </div>
      )}

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Cargando...' : 'Cargar más'}
          </button>
        </div>
      )}
    </div>
  );
};

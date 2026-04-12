'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import {
  useCommunityBySlug,
  useJoinCommunity,
  useLeaveCommunity,
  useCommunityPosts,
  useCommunityMembers,
} from '@/features/communities/hooks/useCommunities';
import {
  UserGroupIcon,
  CheckBadgeIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  LockClosedIcon,
  ArrowTrendingUpIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import {
  formatMembersCount,
  getCategoryLabel,
  getCategoryColor,
  getPrivacyLabel,
  getRoleLabel,
  getRoleColor,
} from '@/features/communities/utils/communityHelpers';

type TabType = 'publicaciones' | 'miembros' | 'acerca-de';

export default function CommunityDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [activeTab, setActiveTab] = useState<TabType>('publicaciones');

  const { data: community, isLoading, error } = useCommunityBySlug(slug);
  const { data: postsData } = useCommunityPosts(community?.id || '', 1, 10);
  const { data: membersData } = useCommunityMembers(community?.id || '', 1, 20);
  const joinMutation = useJoinCommunity();
  const leaveMutation = useLeaveCommunity();

  const posts = postsData?.data || [];
  const members = membersData?.data || [];

  const handleJoinToggle = async () => {
    if (!community) return;

    if (community.isMember) {
      await leaveMutation.mutateAsync(community.id);
    } else {
      await joinMutation.mutateAsync(community.id);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg mb-8" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Comunidad no encontrada
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            La comunidad que buscas no existe o ha sido eliminada
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'publicaciones' as TabType,
      label: 'Publicaciones',
      icon: DocumentTextIcon,
      count: community.stats.postsCount,
    },
    {
      id: 'miembros' as TabType,
      label: 'Miembros',
      icon: UserGroupIcon,
      count: community.stats.membersCount,
    },
    { id: 'acerca-de' as TabType, label: 'Acerca de', icon: InformationCircleIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 bg-linear-to-r from-blue-500 to-purple-500">
        {community.coverImageUrl && (
          <Image
            src={community.coverImageUrl}
            alt={community.name}
            fill
            className="object-cover"
            unoptimized
            priority
          />
        )}
      </div>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20 pb-8 border-b border-gray-200 dark:border-gray-700">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Image */}
              <div className="shrink-0">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-800">
                  {community.profileImageUrl ? (
                    <Image
                      src={community.profileImageUrl}
                      alt={community.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">
                        {community.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                        {community.name}
                      </h1>
                      {community.isVerified && (
                        <CheckBadgeIcon className="w-7 h-7 text-blue-500 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${getCategoryColor(
                          community.category
                        )}`}
                      >
                        {getCategoryLabel(community.category)}
                      </span>

                      {community.privacy !== 'PUBLIC' && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                          <LockClosedIcon className="w-3 h-3" />
                          {getPrivacyLabel(community.privacy)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={handleJoinToggle}
                    disabled={joinMutation.isPending || leaveMutation.isPending}
                    className={`shrink-0 px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                      community.isMember
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {joinMutation.isPending || leaveMutation.isPending
                      ? 'Procesando...'
                      : community.isMember
                      ? 'Miembro'
                      : community.requireApproval
                      ? 'Solicitar Acceso'
                      : 'Unirse'}
                  </button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1.5">
                    <UserGroupIcon className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatMembersCount(community.stats.membersCount)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">miembros</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {community.stats.postsCount}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">publicaciones</span>
                  </div>

                  {community.stats.growthRate > 0 && (
                    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                      <ArrowTrendingUpIcon className="w-5 h-5" />
                      <span className="font-semibold">+{community.stats.growthRate.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 mb-8 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                    transition-colors
                    ${
                      isActive
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className={`
                        ml-1 py-0.5 px-2 rounded-full text-xs font-medium
                        ${
                          isActive
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }
                      `}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="pb-12">
          {activeTab === 'publicaciones' && (
            <div className="space-y-6">
              {posts && posts.length > 0 ? (
                posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {post.authorAvatar && (
                        <Image
                          src={post.authorAvatar}
                          alt={post.authorName}
                          width={40}
                          height={40}
                          className="rounded-full"
                          unoptimized
                        />
                      )}
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {post.authorName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(post.createdAt).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-900 dark:text-white mb-4">{post.content}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{post.likesCount} me gusta</span>
                      <span>•</span>
                      <span>{post.commentsCount} comentarios</span>
                      <span>•</span>
                      <span>{post.sharesCount} compartidas</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    No hay publicaciones disponibles
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'miembros' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {members && members.length > 0 ? (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {member.avatar && (
                        <Image
                          src={member.avatar}
                          alt={member.name}
                          width={48}
                          height={48}
                          className="rounded-full"
                          unoptimized
                        />
                      )}
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                          {member.name}
                          {member.isVerified && (
                            <CheckBadgeIcon className="w-4 h-4 text-blue-500" />
                          )}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          @{member.username}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${getRoleColor(
                        member.role
                      )}`}
                    >
                      {getRoleLabel(member.role)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    No hay miembros disponibles
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'acerca-de' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Acerca de esta comunidad
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                {community.description}
              </p>

              {community.location && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Ubicación
                  </h3>
                  <p className="text-gray-900 dark:text-white">{community.location}</p>
                </div>
              )}

              {community.website && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Sitio Web
                  </h3>
                  <a
                    href={community.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <GlobeAltIcon className="w-4 h-4" />
                    {community.website}
                  </a>
                </div>
              )}

              {community.rules && community.rules.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Reglas de la Comunidad
                  </h3>
                  <ol className="space-y-3">
                    {community.rules.map((rule) => (
                      <li key={rule.id} className="flex gap-3">
                        <span className="font-semibold text-gray-900 dark:text-white shrink-0">
                          {rule.order}.
                        </span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {rule.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {rule.description}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {community.tags && community.tags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Temas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {community.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

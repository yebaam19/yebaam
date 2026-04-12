'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import {
  useClubBySlug,
  useJoinClub,
  useLeaveClub,
} from '@/features/clubs/hooks/useClubs';
import {
  ClubCoverImage,
  ClubHeader,
  ClubTabs,
  ClubMainContent,
  ClubSidebar,
  ClubDetailSkeleton,
  type TabType,
} from '@/features/clubs/components/club-detail';

export default function ClubDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [activeTab, setActiveTab] = useState<TabType>('inicio');


  const { data: club, isLoading, error } = useClubBySlug(slug);
  const joinMutation = useJoinClub();
  const leaveMutation = useLeaveClub();

  const handleMembershipToggle = async () => {
    if (!club) return;
 
    if (club.isMember) {

      await leaveMutation.mutateAsync(club.id);
    } else {
      await joinMutation.mutateAsync(club.id);
      await joinMutation.mutateAsync(club.id);
    }
  };

  const isMutating = joinMutation.isPending || leaveMutation.isPending;


  if (isLoading) {
    return <ClubDetailSkeleton />;
  }

  if (error || !club) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Club no encontrado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            El club que buscas no existe o ha sido eliminado
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Cover Image */}
      <ClubCoverImage coverImageUrl={club.coverImageUrl} clubName={club.name} />

      {/* Content Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ClubHeader
          club={club}
          isMember={club.isMember || false}
          isLoading={isMutating}
          onMembershipToggle={handleMembershipToggle}
        />

        {/* Tabs */}
        <ClubTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Main Content */}
          <ClubMainContent club={club} activeTab={activeTab} />

          {/* Sidebar */}
          <ClubSidebar club={club} />
        </div>
      </div>
    </div>
  );
}

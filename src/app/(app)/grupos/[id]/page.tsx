'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useGroup } from '@/features/groups/hooks/useGroups';
import { GroupDetailSkeleton } from '@/features/groups/components/detail/GroupDetailSkeleton';
import { GroupDetailNotFound } from '@/features/groups/components/detail/GroupDetailNotFound';
import { GroupDetailHero } from '@/features/groups/components/detail/GroupDetailHero';
import { GroupDetailContent } from '@/features/groups/components/detail/GroupDetailContent';
import type { GroupDetailTab } from '@/features/groups/components/detail/GroupDetailTabs';

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;

  const { data: group, isLoading } = useGroup(groupId);
  const [activeTab, setActiveTab] = useState<GroupDetailTab>('posts');

  if (isLoading) return <GroupDetailSkeleton />;
  if (!group) return <GroupDetailNotFound basePath="/grupos" />;

  return (
    <div className="min-h-dvh min-w-0 bg-neutral-50 dark:bg-neutral-950">
      <GroupDetailHero
        group={group}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        basePath="/grupos"
      />
      <GroupDetailContent activeTab={activeTab} group={group} />
    </div>
  );
}

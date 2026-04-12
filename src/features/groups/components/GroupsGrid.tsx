'use client';

import { GroupCard } from './GroupCard';
import type { Group } from '../types/group.types';

interface GroupsGridProps {
  groups: Group[];
  emptyMessage?: string;
}

export function GroupsGrid({ groups, emptyMessage }: GroupsGridProps) {
  if (groups.length === 0 && emptyMessage) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600 dark:text-neutral-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { UserGroupIcon } from '@/components/icons/heroicons-shim';

interface Group {
  id: string;
  name: string;
  members: string;
}

interface SuggestedGroupsProps {
  groups: Group[];
}

export default function SuggestedGroups({ groups }: SuggestedGroupsProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          Grupos sugeridos
        </h3>
        <Link
          href="/grupos/descubrir"
          className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          Explorar
        </Link>
      </div>
      <div className="space-y-2">
        {groups.map((group) => (
          <Link
            key={group.id}
            href={`/grupos/${group.id}`}
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-purple-600">
              <UserGroupIcon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                {group.name}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {group.members}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
